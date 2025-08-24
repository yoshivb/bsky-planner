import { Pool } from "pg";

export function usePostgres () {
	if (!process.env.DATABASE_URL) {
		throw createError('Missing `DATABASE_URL` environment variable')
	}

	const pool = new Pool({
		connectionString: process.env.DATABASE_URL
	});

	return pool;
}
