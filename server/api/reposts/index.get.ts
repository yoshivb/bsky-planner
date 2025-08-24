import { View as EmbedImagesView } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import { addDays } from 'date-fns';
import { DBScheduledRepost, RepostType, ScheduledRepost } from '~~/shared/utils/types';

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const session = await requireUserSession(event);
	const postgres = usePostgres();
	
	const {startDay, dayAmount} = getQuery<{startDay: Date, dayAmount: number}>(event);
	const clampedDays = Math.max(Math.min(dayAmount, 7), 0);
	const endDay = addDays(startDay, clampedDays);
	
	const dbreposts = await postgres.query<DBScheduledRepost>(
		"SELECT * FROM reposts WHERE did = $1 AND scheduled_for >= $2::timestamptz AND scheduled_for < $3::timestamptz LIMIT 50",
		[session.user.did, startDay, endDay]);
		
	const dbrepostUris = [...new Set(dbreposts.rows.map((repost) => repost.uri))];
	if(dbrepostUris.length === 0)
	{
		return [];
	}

	const {rows: users} = await postgres.query<DBUser>("SELECT * FROM users WHERE did = $1 LIMIT 1", [session.user.did]);
	if(users.length === 0)
	{
		return;
	}
			
	const bsky = await useBsky(session.user.did, users[0].app_password);
	const foundPosts = await bsky.getPosts({uris: dbrepostUris });

	const reposts : ScheduledRepost[] = dbreposts.rows.map((repost) => {
		const foundPost = foundPosts.data.posts.find((post) => post.uri === repost.uri);
		if(foundPost)
		{
			let foundEmbed : ScheduledImageData<string>[] | undefined = undefined;
			if(foundPost.embed?.$type === 'app.bsky.embed.images#view')
			{
				foundEmbed = (foundPost.embed as EmbedImagesView).images.map((image) => {
					return {
						file: image.thumb,
						alt: image.alt
					}
				})
			}

			return {
				id: repost.id,
				status: repost.status,
				scheduled_for: repost.scheduled_for,
				content: {
					text: foundPost.record["text"] as string,
					embed: foundEmbed,
					labels: foundPost.labels?.[0]?.val
				},
				repost_type: "published_post" as RepostType,
				did: repost.did
			};
		}
	}).filter((repost) => repost !== undefined);
	return reposts;
})