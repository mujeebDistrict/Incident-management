# Incident Management Platform

A one-week AI-assisted engineering sprint building an incident management
platform (a lightweight PagerDuty/Opsgenie). See ARCHITECTURE.md for
design decisions and CONTRIBUTING.md for git workflow and AI usage.

## Repo layout

Backend and frontend are separate sibling repos, not a monorepo:

master-incident-management-platform/
- Incident-management/           NestJS API + standalone BullMQ worker
  - worker/                      separate process, own package.json,
                                  shares prisma/schema.prisma
- Incident-Management-Frontend/  React (Vite) app

## Stack

NestJS, PostgreSQL (Prisma 6.19.3), Redis, BullMQ, Socket.IO,
React (Vite), Swagger/OpenAPI, GitHub Actions CI,
Docker Compose (Postgres/Redis only — see Known Gaps)

## Status: Day 7 of 7 — feature complete

### Done
- Auth: register/login/JWT, role guards (ADMIN/ENGINEER/VIEWER)
- Users, Teams (+ membership), Services — full CRUD, role-gated writes
- Incidents: full CRUD, state machine (linear, no reopen), pagination,
  filtering (severity/status/serviceId), assign, resolve
- Redis caching (GET /services, GET /dashboard/summary) with
  write-invalidation
- Rate limiting: global (20/min/IP), stricter on /auth/login (5/min)
- BullMQ notification pipeline: CRITICAL incident assignment to
  queue to standalone worker to Notification row
- WebSocket live updates on incident change (status, assign, resolve,
  comments)
- Comments on incidents (with author info, live-updating)
- Dashboard summary endpoint + page
- Audit log (team membership changes only), ADMIN-only, paginated
- Automated tests: state machine unit tests, full auth/RBAC E2E suite
  (14 E2E + 12 unit tests, all passing)
- Global Prisma error handling (P2002/P2025/P2003 mapped to sensible
  HTTP responses, not raw 500s)
- Swagger/OpenAPI docs at /api-docs, grouped by module, with bearer
  auth support for testing endpoints directly from the docs UI
- CI (GitHub Actions): install, prisma generate/migrate, build, unit
  tests, E2E tests, against real Postgres/Redis service containers,
  on every push/PR

### Known gaps
- Docker: api/worker/web never containerized or tested.
  Only Postgres and Redis have been run via docker compose up.
  The app has run via npm run start:dev all week — docker-compose.yml
  still references a stale monorepo layout (apps/api, apps/worker)
  that no longer matches this repo's actual structure. This means
  the app cannot currently be deployed as docker-compose.yml
  describes — that file needs a rewrite, not just a fix.
- Sorting on GET /incidents (severity/status/date) — not implemented,
  deferred by choice
- No frontend page for the audit log (API-only feature)
- Dashboard.tsx shows counts only — no charts/trends
- No optimistic locking / concurrency control — two simultaneous
  updates to the same incident are not specially handled (last write
  wins, no conflict detection)

## Known issues / decisions worth knowing about

- Prisma pinned to 6.x, not 7.x. Prisma 7 requires a driver-adapter
  setup (prisma.config.ts, changed PrismaClient constructor) across
  every service. Deferred for scope.
- BullMQ, not RabbitMQ/Kafka. Already had Redis in the stack; the
  actual need (one producer, one consumer, "do this later") doesn't
  justify a dedicated message broker's operational overhead.
- git filter-repo was used to strip ~100MB of accidentally-committed
  worker/node_modules from the entire git history. This rewrote every
  commit hash. Anyone with an existing clone must re-clone or run
  git fetch origin && git reset --hard origin/master.
- One npm audit advisory (deepmerge-ts, via @prisma/config) is a
  known, accepted risk — affects the Prisma CLI only, not runtime code.
- Several dependencies (@nestjs/websockets, @nestjs/platform-socket.io,
  @nestjs/swagger) required pinning to the ^11.0.0 line explicitly —
  their latest majors require @nestjs/common@^12, one version ahead
  of this project's @nestjs/common@11.x.

## Local setup

Backend:
cd Incident-management
cp .env.example .env       (adjust DATABASE_URL, REDIS_URL, JWT_SECRET)
docker compose up postgres redis -d
npm install
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/schema.prisma
npm run start:dev          (http://localhost:3000)
Swagger docs:                http://localhost:3000/api-docs

Worker (separate terminal):
cd Incident-management/worker
npm install
npx prisma generate --schema=../prisma/schema.prisma
npm run start:dev

Frontend (separate terminal):
cd Incident-Management-Frontend
npm install
npm run dev                (http://localhost:5173)

## Running tests

cd Incident-management
npm test          (unit tests)
npm run test:e2e  (E2E — auth flow, role enforcement, protected routes)

Also runs automatically in CI on every push/PR — see
.github/workflows/ci.yml.

## Repo layout (backend)

Incident-management/
- src/
  - auth/        register/login, JWT strategy, guards, decorators
  - users/       GET /users/me, GET /users
  - teams/       CRUD + membership, audit-logged
  - services/    CRUD, cached
  - incidents/   CRUD, state machine, comments, WebSocket gateway
  - dashboard/   cached summary endpoint
  - audit/       audit log service + endpoint
  - redis/       RedisService (ioredis, @Global)
  - prisma/      PrismaService (@Global)
  - common/      global exception filter, health check
- worker/        standalone BullMQ consumer process
- prisma/        schema.prisma, migrations/
- test/          E2E specs
- .github/workflows/ci.yml