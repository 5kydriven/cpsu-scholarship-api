# Homelab Production Deployment

This deployment runs the Hono API on Coolify using Bun. The API keeps PostgreSQL in Neon and calls Cloudflare R2 and Workers AI through their external APIs.

## Coolify settings

- Build method: Dockerfile
- Dockerfile: `Dockerfile`
- Container port: `3000`
- Health check path: `/healthz`
- Start command: provided by the Dockerfile (`bun run start:homelab`)
- Host binding: `0.0.0.0`

Do not deploy the development PostgreSQL service from `docker-compose.yml` for production.

## Required environment variables

```text
DATABASE_URL=<existing production Neon URL>
DATABASE_DRIVER=pg
BETTER_AUTH_SECRET=<existing auth secret>
BETTER_AUTH_URL=https://<api-hostname>
CORS_ORIGIN=https://<frontend-origin>
PUBLIC_URL=https://<public-r2-hostname>
PORT=3000

CLOUDFLARE_ACCOUNT_ID=<Cloudflare account ID>
CLOUDFLARE_AI_API_TOKEN=<least-privilege Workers AI token>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<R2 access key>
R2_SECRET_ACCESS_KEY=<R2 secret>
R2_BUCKET=<production R2 bucket>
```

Enter secrets in Coolify's environment UI. Do not commit them.

For SKYSERVER, the public API hostname is
`https://cpsu-scholarship-api.skydriven.xyz`. Set `BETTER_AUTH_URL` to that
origin. `CORS_ORIGIN` must contain frontend origins without trailing slashes.
OpenAPI uses `BETTER_AUTH_URL` so documentation requests keep HTTPS when
Cloudflare Tunnel forwards HTTP to the application.

## Public routing on SKYSERVER

The Coolify application has the custom network alias `cpsu-scholarship-api` on
the `coolify` Docker network. Cloudflared joins that external network through
the homelab's live named-tunnel Compose configuration. No application host port
is required.

In the existing Cloudflare Tunnel, publish
`cpsu-scholarship-api.skydriven.xyz` to the HTTP service
`http://cpsu-scholarship-api:3000`, with no path restriction. The API remains
protected by its own authentication on protected routes. Leave `PUBLIC_URL`
pointed at the R2 file domain, rather than the API hostname.

## Database

`DATABASE_DRIVER=pg` makes the serverful runtime use a pooled `pg` connection through Drizzle. The Cloudflare Worker path continues to use Neon HTTP when `DATABASE_DRIVER` is not set.

Run migrations once before the first production start with the Coolify environment loaded:

```text
bun drizzle-kit migrate
```

## Cloudflare-backed services

The homelab runtime uses:

- R2's S3-compatible API for file uploads.
- Workers AI's REST API for analytics classification and responses.

`PUBLIC_URL` must point to a reachable R2 public/custom domain because uploaded file responses contain URLs based on this value.

## CI

The GitHub workflow now verifies typechecking and tests only. It no longer deploys this application to Cloudflare Workers.
