type WorkersAiFetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

type WorkersAiResponse = {
	success?: boolean;
	result?: unknown;
	errors?: Array<{ message?: string }>;
};

export type WorkersAiClient = {
	run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

export const createWorkersAiClient = ({
	accountId,
	apiToken,
	fetchImpl = fetch,
}: {
	accountId: string;
	apiToken: string;
	fetchImpl?: WorkersAiFetch;
}): WorkersAiClient => ({
	async run(model, input) {
		const response = await fetchImpl(
			`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(input),
			},
		);

		const payload = (await response.json().catch(() => null)) as
			| WorkersAiResponse
			| null;

		if (!response.ok || payload?.success === false) {
			const detail = payload?.errors?.[0]?.message;
			throw new Error(
				`Workers AI request failed (${response.status})${detail ? `: ${detail}` : ''}`,
			);
		}

		return payload?.result;
	},
});
