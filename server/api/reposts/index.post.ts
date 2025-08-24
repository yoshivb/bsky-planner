import { getRequiredString } from "~~/server/utils/readFormData";
import { DBScheduledRepost } from "~~/shared/utils/types";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const session = await requireUserSession(event);
	const formData = await readFormData(event);
	
	const url = getRequiredString(formData, "url");
	const scheduled_for = getRequiredString(formData, "scheduled_for");

	const parsedUrl = new URL(url);
	const urlPath = parsedUrl.pathname.split("/").filter(path => path);
	const [profileKey, handle, postKey, rkey] = parsedUrl.pathname.split("/").filter(path => path);

	if(profileKey !== 'profile' || postKey !== 'post')
	{
		throw createError({
			statusCode: 400,
			message: `Invalid post URL`,
		});
	}

	const postgres = usePostgres();
	const {rows: users} = await postgres.query<DBUser>("SELECT * FROM users WHERE did = $1 LIMIT 1", [session.user.did]);
	if(users.length === 0)
	{
		return;
	}
			
	const bsky = await useBsky(session.user.did, users[0].app_password);
	try
	{
		const {data: didData, success: didValid} = await bsky.resolveHandle({handle});
		if(!didValid)
		{
			console.error("Handle is not valid", didData);
			throw createError({
				statusCode: 400,
				message: `Invalid post URL`,
			});
		}

		const foundPost = await bsky.getPost({
			repo: didData.did,
			rkey
		});

		const result = await postgres.query<DBScheduledRepost>(
			"INSERT INTO reposts (did, cid, uri, scheduled_for, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[session.user.did, foundPost.cid, foundPost.uri, scheduled_for, "pending",]
		);
		
		return result.rows;
	}
	catch(e)
	{
		console.error(e);
		throw createError({
			statusCode: 400,
			message: `Invalid post URL`,
		});
	}
})