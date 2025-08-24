import { DBUser, registerSchema } from '~~/shared/utils/types';
import { HandleResolver } from '@atproto/identity';
import { Agent, CredentialSession } from '@atproto/api';

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, registerSchema.parse);
	
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

	const loginResponse = await agentSession.login({identifier: did, password: body.app_password});
	if(!loginResponse.success)
	{
		throw createError({
			statusCode: 400,
			statusMessage: 'App password is not valid'
		});
	}

	const hashedPassword = await hashPassword(body.password);
	const postgres = usePostgres();
	await postgres.query<DBUser>('INSERT INTO users (did, password, app_password) VALUES ($1, $2, $3) RETURNING *',
		[did, hashedPassword, body.app_password]
	);

	await setUserSession(event, {
		user: {
			did
		},
		secure: {
			appPassword: body.app_password
		}
	});

	return {success: true};
})