# Disaster Alert Network

Real-time disaster alerts for the public and the authorities who publish and monitor them.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/disaster-alerts` — React web app with public alert feed and authority console
- `artifacts/api-server/src/routes/alerts.ts` — alert, publishing, delivery, and dashboard endpoints
- `lib/api-spec/openapi.yaml` — source of truth for alert API contracts
- `lib/db/src/schema/alerts.ts` — PostgreSQL alert model

## Architecture decisions

- The public feed and authority console use the same alert and delivery contracts.
- Alerts are persisted in PostgreSQL so drafts and published notices survive refreshes.
- Alert publishing is explicit and changes a draft to an active notice with delivery metrics.
- The frontend uses generated React Query hooks from the OpenAPI contract.

## Product

- Public users can browse active alerts, search by place or event, and open response guidance.
- Coordinators can review dashboard health, create drafts, edit drafts, publish notices, and inspect channel delivery.
- Alerts support severity, disaster type, affected areas, response instructions, expiry, source authority, and delivery channels.

## User preferences

No additional preferences recorded.

## Gotchas

- Regenerate the API client after changing `lib/api-spec/openapi.yaml`.
- Use the managed API and web workflows rather than starting services from the workspace root.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
