import { DBUser, loginSchema } from '~~/shared/utils/types';
import { Agent, CredentialSession } from '@atproto/api';

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, loginSchema.parse);

	const agentSession = new CredentialSession(new URL("https://bsky.social"));
	const bskyAgent = new Agent(agentSession);
	let did = '';
	try{
		const {data: didData, success: didValid} = await bskyAgent.resolveHandle({handle: body.handle}, {});
		if(!didValid)
		{
			console.error("Handle is not valid", didData);
			throw createError({
				statusCode: 400,
				statusMessage: 'Handle is not a valid bluesky handle.'
			});
		}
		did = didData.did;
	}
	catch(e)
	{
		console.error(e);
		throw createError({
			statusCode: 400,
			statusMessage: 'Handle is not a valid bluesky handle.'
		});
	}

	const postgres = usePostgres();
	const {rows: users} = await postgres.query<DBUser>(`SELECT * FROM users WHERE did = $1 LIMIT 1`,
		[did]
	);

	if(users.length === 0)
	{
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		});
	}

	const result = await verifyPassword(users[0].password, body.password);
	if(!result)
	{
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		});
	}

	await setUserSession(event, {
		user: {
			did: users[0].did
		}
	});
	const session = await getUserSession(event);

	return {
		success: true,
		id: session.id
	};
})