import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createR2S3Bucket } from '../src/runtime/r2-s3';
import { createWorkersAiClient } from '../src/runtime/workers-ai';

describe('R2 S3 adapter', () => {
	test('uploads a web stream with content type to the configured bucket', async () => {
		let commandInput: Record<string, unknown> | undefined;
		const client = {
			send: async (command: { input: object }) => {
				commandInput = command.input as Record<string, unknown>;
				return {};
			},
		};
		const bucket = createR2S3Bucket({
			client,
			bucketName: 'cpsu-application-docs',
		});

		await bucket.put(
			'applications/example.txt',
			new Blob(['hello']).stream(),
			{ httpMetadata: { contentType: 'text/plain' } },
		);

		assert.deepEqual(commandInput && {
			Bucket: commandInput.Bucket,
			Key: commandInput.Key,
			ContentType: commandInput.ContentType,
		}, {
			Bucket: 'cpsu-application-docs',
			Key: 'applications/example.txt',
			ContentType: 'text/plain',
		});
		assert.equal(Buffer.from(commandInput?.Body as Uint8Array).toString(), 'hello');
	});
});

describe('Workers AI REST adapter', () => {
	test('returns the REST API result using the Workers AI binding shape', async () => {
		const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
			assert.match(String(input), /\/accounts\/account-123\/ai\/run\/@cf\/meta\/test-model/);
			assert.deepEqual(init?.headers, {
				Authorization: 'Bearer ai-token',
				'Content-Type': 'application/json',
			});
			return new Response(JSON.stringify({
				success: true,
				result: { response: '{"metric":"total_students"}' },
			}), { status: 200 });
		};
		const ai = createWorkersAiClient({
			accountId: 'account-123',
			apiToken: 'ai-token',
			fetchImpl,
		});

		const result = await ai.run('@cf/meta/test-model', {
			messages: [{ role: 'user', content: 'classify this' }],
		});
		assert.deepEqual(result, { response: '{"metric":"total_students"}' });
	});

	test('throws a useful error when the REST API rejects the request', async () => {
		const ai = createWorkersAiClient({
			accountId: 'account-123',
			apiToken: 'ai-token',
			fetchImpl: async () => new Response('bad request', { status: 400 }),
		});

		await assert.rejects(
			ai.run('@cf/meta/test-model', {}),
			/Workers AI request failed \(400\)/,
		);
	});
});
