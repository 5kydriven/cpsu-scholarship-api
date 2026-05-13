# CPSU Scholarship API

Hono API deployed on Vercel Node Functions with Better Auth, Drizzle, and PostgreSQL.

## Local Development

```txt
bun install
bun run dev
```

The local API runs through Vercel CLI on `http://localhost:8787`.

Set local values in `.env` or pull them from Vercel:

```txt
bun run vercel:pull
```

Required runtime variables:

```txt
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-long-random-secret-at-least-32-chars
CORS_ORIGIN=http://localhost:3000
```

`BETTER_AUTH_URL` is optional on Vercel when System Environment Variables are exposed, because the app can derive it from `VERCEL_URL`. Keep `BETTER_AUTH_URL=http://localhost:8787` for local development.

## Database

```txt
bun run db:generate
bun run db:migrate
bun run db:studio
```

The existing PostgreSQL/Neon-compatible `DATABASE_URL` is still used. No database migration is required for the Vercel deployment migration.

## Deploy

Use one Vercel project with Preview and Production environments.

```txt
bun run deploy:preview
bun run deploy
```

In Vercel Project Settings:

- Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `CORS_ORIGIN` to the right environments.
- Mark secrets as sensitive.
- Enable automatically exposed System Environment Variables so `VERCEL_URL` is available.

## Verify

```txt
bun run typecheck
bun run vercel:build
```
