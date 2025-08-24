import { Agent, CredentialSession } from "@atproto/api";

export async function useBsky(did: string, appPassword: string) {
	const session = new CredentialSession(new URL("https://bsky.social"));
	await session.login({identifier: did, password: appPassword});
	const agent = new Agent(session);
	return agent;
}