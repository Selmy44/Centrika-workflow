# Centrika Backend (scaffold)

This folder contains a minimal backend scaffold extracted from the monorepo. It uses Postgres via `postgres` driver and `drizzle-orm`.

Quick start (local):

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install deps:

```bash
cd backend
npm install
```

3. Run dev server:

```bash
npm run dev
```

The server exposes a minimal tRPC endpoint at `/api/trpc/health`.

Notes:
- This is a scaffold. To migrate the full backend from the monorepo, copy router implementations (e.g. `server/routers/requests.ts`, `server/db.ts`) into `backend/src/` and adapt imports as needed.
- The scaffold uses `drizzle-orm/postgres-js` via the `postgres` driver. Use `drizzle-kit` for migrations and schema generation.
