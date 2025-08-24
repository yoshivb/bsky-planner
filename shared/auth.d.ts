declare module '#auth-utils' {
	interface User {
		did: string;
	}

	interface UserSesssion {
		loggedInAt: number;
	}

	interface SecureSessionData {
		appPassword: string;
	}
}
export {}