import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { closeDatabasePools, createDbConnection } from '../src/db';

after(async () => {
	await closeDatabasePools();
});

test('reuses a pooled PostgreSQL Drizzle connection for serverful runtime', async () => {
	const first = await createDbConnection(
		'postgresql://postgres:postgres@127.0.0.1:5432/cpsu',
		'pg',
	);
	const second = await createDbConnection(
		'postgresql://postgres:postgres@127.0.0.1:5432/cpsu',
		'pg',
	);

	assert.equal(first.db, second.db);
});
