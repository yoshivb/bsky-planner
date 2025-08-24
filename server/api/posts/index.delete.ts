import path from "path";
import fs from 'fs/promises';

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const postgres = usePostgres();
	const {id} = getQuery<{id:number}>(event);

	const deletedPosts = await postgres.query<DBScheduledPost>("DELETE FROM posts WHERE id = $1 RETURNING *", [id]);

	try
	{
		await Promise.all(deletedPosts.rows.map((post) => {
			return post.content.embed?.map(async (embed) => {
				return await fs.unlink(path.join(config.uploadFolder, embed.file));
			})
		}));
	}
	catch(e)
	{
		console.error(e);
	}

	return {success: true};
})