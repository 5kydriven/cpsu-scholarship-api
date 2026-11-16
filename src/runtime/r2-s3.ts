import { PutObjectCommand } from '@aws-sdk/client-s3';

type S3ClientLike = {
	send(command: { input: object }): Promise<unknown>;
};

type R2PutOptions = {
	httpMetadata?: {
		contentType?: string;
	};
};

export type R2S3Bucket = {
	put(key: string, value: unknown, options?: R2PutOptions): Promise<void>;
};

const toBytes = async (value: unknown): Promise<Uint8Array> => {
	if (value instanceof Uint8Array) return value;
	if (value instanceof ArrayBuffer) return new Uint8Array(value);
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	if (typeof value === 'string') return new TextEncoder().encode(value);
	if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
	if (value && typeof (value as ReadableStream).getReader === 'function') {
		return new Uint8Array(await new Response(value as BodyInit).arrayBuffer());
	}

	throw new TypeError('Unsupported R2 object body type');
};

export const createR2S3Bucket = ({
	client,
	bucketName,
}: {
	client: S3ClientLike;
	bucketName: string;
}): R2S3Bucket => ({
	async put(key, value, options) {
		await client.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: key,
				Body: await toBytes(value),
				ContentType: options?.httpMetadata?.contentType,
			}),
		);
	},
});

export const createR2S3Client = ({
	endpoint,
	accessKeyId,
	secretAccessKey,
}: {
	endpoint: string;
	accessKeyId: string;
	secretAccessKey: string;
}) => {
	// Imported lazily so the Worker build never initializes the Node/Bun S3 client.
	return import('@aws-sdk/client-s3').then(
		({ S3Client }) =>
			new S3Client({
				region: 'auto',
				endpoint,
				credentials: { accessKeyId, secretAccessKey },
			}),
	);
};
