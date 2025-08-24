export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const postgres = usePostgres();
	const {id} = getQuery<{id:number}>(event);

	await postgres.query<DBScheduledPost>("DELETE FROM reposts WHERE id = $1", [id]);

	return {success: true};
})