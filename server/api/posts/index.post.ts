import { getOptionalFileArray, getOptionalString, getOptionalStringArray, getRequiredString } from "~~/server/utils/readFormData";
import path from 'path';
import sharp from 'sharp'

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const session = await requireUserSession(event);
	const formData = await readFormData(event);
	
	const text = getRequiredString(formData, "text");
	const labels = getOptionalString(formData, "labels");
	const scheduled_for = getRequiredString(formData, "scheduled_for");
	const repost_dates = getOptionalStringArray(formData, "repost_dates") ?? [];

	const embed_files = getOptionalFileArray(formData, "embed_file");
	const embed_alts = getOptionalStringArray(formData, "embed_alt");
	let embed : ScheduledImageData<string>[]|undefined = undefined;

	if(embed_files && embed_files.length > 0)
	{
		if(!embed_alts || embed_files.length != embed_alts.length)
		{
			throw createError({
				statusCode: 400,
				message: 'alts are missing from embeds.',
			});
		}
		if(embed_files.length > config.public.uploadLimits.maxFileCount)
		{
			throw createError({
				statusCode: 400,
				message: 'Too many files.',
			});
		}
		embed_files.forEach((file) => {
			if(file.size > config.public.uploadLimits.maxFileSize)
			{
				throw createError({
					statusCode: 400,
					message: 'Files are too big.',
				});
			}
		});
		embed = await Promise.all(embed_files.map(async (file, index) => {
			const alt = embed_alts[index];
			const fileBuffer = await file.arrayBuffer();
			const uniqueName = `${crypto.randomUUID()}${path.extname(file.name).toLowerCase()}`;
  			const finalPath = path.join(config.uploadFolder, uniqueName);
			await sharp(fileBuffer).toFile(finalPath);
			return {
				file: uniqueName,
				alt: alt.length > 0 ? alt : undefined
			}
		}));
	}

	let content : ScheduledPostContent<string> = {
		text,
		labels,
		embed
	}

	const postgres = usePostgres();
	const result = await postgres.query<DBScheduledPost>(
		"INSERT INTO posts (did, content, scheduled_for, repost_dates, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
		[session.user.did, content, scheduled_for, repost_dates, "pending",]
	);
	return result.rows;
})