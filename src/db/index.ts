import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

type DatabaseDriver = 'neon-http' | 'pg';
type PgConnection = Awaited<ReturnType<typeof createPgConnection>>;

const isLocalDatabase = (databaseUrl: string) => {
	const hostname = new URL(databaseUrl).hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1';
};

const createNeonDb = (databaseUrl: string) => {
	const sql = neon(databaseUrl);
	return drizzleNeon(sql, { schema, casing: 'snake_case' });
};

const neonDbCache = new Map<string, ReturnType<typeof createNeonDb>>();

const getNeonDb = (databaseUrl: string) => {
	const cached = neonDbCache.get(databaseUrl);
	if (cached) return cached;

	const db = createNeonDb(databaseUrl);
	neonDbCache.set(databaseUrl, db);
	return db;
};

async function createPgConnection(databaseUrl: string) {
	const [{ Pool }, { drizzle }] = await Promise.all([
		import('pg'),
		import('drizzle-orm/node-postgres'),
	]);

	const pool = new Pool({
		connectionString: databaseUrl,
		max: 10,
	});

	return {
		db: drizzle(pool, { schema, casing: 'snake_case' }),
		pool,
	};
}

const pgConnectionCache = new Map<string, Promise<PgConnection>>();

const getPgConnection = (databaseUrl: string) => {
	const cached = pgConnectionCache.get(databaseUrl);
	if (cached) return cached;

	const connection = createPgConnection(databaseUrl);
	pgConnectionCache.set(databaseUrl, connection);
	return connection;
};

export const closeDatabasePools = async () => {
	const connections = await Promise.all(pgConnectionCache.values());
	await Promise.all(connections.map(({ pool }) => pool.end()));
	pgConnectionCache.clear();
};

export const createDbConnection = async (
	databaseUrl: string,
	driver: DatabaseDriver = 'neon-http',
) => {
	if (driver === 'pg' || isLocalDatabase(databaseUrl)) {
		const { db } = await getPgConnection(databaseUrl);
		return { db };
	}

	return {
		db: getNeonDb(databaseUrl),
	};
};

export type Db = Awaited<ReturnType<typeof createDbConnection>>['db'];
