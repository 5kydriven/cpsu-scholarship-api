import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeonServerless } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const isLocalDatabase = (databaseUrl: string) => {
	const hostname = new URL(databaseUrl).hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1';
};

export const createDbConnection = async (databaseUrl: string) => {
	if (isLocalDatabase(databaseUrl)) {
		const [{ Client }, { drizzle: drizzleNodePostgres }] = await Promise.all([
			import('pg'),
			import('drizzle-orm/node-postgres'),
		]);

		const client = new Client({ connectionString: databaseUrl });
		await client.connect();

		return {
			db: drizzleNodePostgres(client, { schema, casing: 'snake_case' }),
			dispose: () => client.end(),
		};
	}

	const pool = new Pool({
		connectionString: databaseUrl,
		max: 1,
	});

	return {
		db: drizzleNeonServerless(pool, { schema, casing: 'snake_case' }),
		dispose: () => pool.end(),
	};
};

export type Db = Awaited<ReturnType<typeof createDbConnection>>['db'];
