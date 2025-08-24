export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const postgres = usePostgres();
	const {id, repost_dates: rawRepost_dates} = getQuery<{id:number, repost_dates: Date|Date[]|undefined}>(event);

	let repost_dates : Date[]|undefined = undefined;
	if(Array.isArray(rawRepost_dates) || rawRepost_dates === undefined)
	{
		repost_dates = rawRepost_dates;
	}
	else
	{
		repost_dates = [rawRepost_dates];
	}

	await postgres.query<DBScheduledPost>(
		"UPDATE posts SET repost_dates = $2 WHERE id = $1", 
		[
			id, 
			repost_dates
		]);

	return {success: true};
})