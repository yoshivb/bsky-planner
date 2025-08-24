import datauri from 'datauri'
import path from 'path';
import { addDays } from 'date-fns';

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const session = await requireUserSession(event);
	const postgres = usePostgres();

	const {startDay, dayAmount} = getQuery<{startDay: Date, dayAmount: number}>(event);
	const clampedDays = Math.max(Math.min(dayAmount, 7), 0);
	const endDay = addDays(startDay, clampedDays);

	const dbposts = await postgres.query<DBScheduledPost>(
		`SELECT * FROM 
			posts WHERE 
			did = $1 AND ( 
				( scheduled_for >= $2::timestamptz AND scheduled_for < $3::timestamptz ) 
				 OR 
				( $2::timestamptz <= ANY(repost_dates) AND $3::timestamptz > ANY(repost_dates) ) 
			) LIMIT 50`, 
		[session.user.did, startDay, endDay]);

	const asyncPosts = dbposts.rows.map(async (post) => {
		const embed = post.content.embed ? await Promise.all(post.content.embed.map(async (embed) => 
		{
			const finalPath = path.join(config.uploadFolder, embed.file);
			return {
				file: await datauri(finalPath) ?? '',
				alt: embed.alt
			};
		})) : undefined;
		return {
			...post,
			content: {
				...post.content,
				embed
			}
		}
	});
	const posts : DBScheduledPost[] = await Promise.all(asyncPosts);
	return posts;
})