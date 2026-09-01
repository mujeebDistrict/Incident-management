# Architecture

## Repo structure

Backend (Incident-management/) and frontend
(Incident-Management-Frontend/) are separate sibling repos, each
with their own package.json/node_modules/git history — not an
apps/* monorepo as originally planned on Day 1. The restructure
happened before Day 2 and everything since has followed this layout.

## Stack

React (Vite) to NestJS API to PostgreSQL (Prisma 6.19.3)
NestJS to Redis (cache + rate limiting)
NestJS to BullMQ to standalone worker process to Redis to Postgres
NestJS and React connected over WebSocket (Socket.IO) for live incident
updates

## Incident state machine

OPEN -> INVESTIGATING -> IDENTIFIED -> MONITORING -> RESOLVED

- Strictly linear — no skipping stages, decided explicitly (not
  specified in the original guide, chosen for a clean, defensible answer
  over ambiguity).
- RESOLVED is terminal — no reopening, per the guide's explicit rule.
- Enforced in exactly one place: validateStatusTransition() in
  src/incidents/incident-status.util.ts — a pure function, unit tested
  (9 cases: every valid transition, skip-ahead, reopen, no-op). Called
  from both IncidentsService.update() (generic PATCH) and .resolve()
  (dedicated endpoint) — no duplicated logic between them.

## Role matrix

Action                          | ADMIN | ENGINEER | VIEWER
Create/manage teams, services   | yes   | no       | no
View teams/services/incidents   | yes   | yes      | yes
Create incident                 | yes   | yes      | yes
Update/assign/resolve incident  | yes   | yes      | no
Comment on incident              | yes   | yes      | yes
View audit log                   | yes   | no       | no

## Why BullMQ, not RabbitMQ/Kafka

Redis was already in the stack for caching/rate-limiting — BullMQ runs
on top of it, adding zero new infrastructure. The actual requirement
(one producer, one consumer, "process this notification asynchronously")
doesn't need a dedicated message broker's routing/fanout/exactly-once
guarantees. Would revisit for a system with multiple services, high
message volume, or complex routing needs.

## Why the worker is a separate process, not a module inside the API

Notification processing shouldn't share the API's event loop or crash
domain. Confirmed in practice: assigning a CRITICAL incident returns
the HTTP response immediately; the worker (a fully independent Node
process, its own terminal, own package.json) picks up the job from
Redis and creates the Notification row asynchronously, with zero
coupling beyond the shared prisma/schema.prisma.

## Auth / token storage

- JWT (sub, role payload) issued on login, validated by a Passport
  JWT strategy reading JWT_SECRET/JWT_EXPIRES_IN via ConfigService
  (not process.env directly — avoids a module-load-order race where
  .env isn't guaranteed loaded yet).
- RolesGuard + @Roles() decorator, reading required roles from route
  metadata via Reflector.
- Frontend: token held in React state (AuthContext), not localStorage
  — reduces XSS exposure, at the cost of losing session on page refresh
  (accepted tradeoff for this sprint).

## Caching strategy

- GET /services: 30s TTL, invalidated on create/update.
- GET /dashboard/summary: 15s TTL (shorter — dashboard data changes
  more often and staleness is more visible there).
- Pattern: check Redis, miss, query Postgres, cache, return.
  Verified via Redis CLI (GET/DEL observed directly) plus response
  timing.

## Error handling

AllExceptionsFilter (global) handles two categories:
1. Prisma errors (P2002 unique violation to 409, P2025 not found
   to 404, P2003 foreign-key violation to 400, others to 500) — added
   Day 6 after discovering IncidentsService.assign() could pass an
   uncaught FK violation straight through to a raw 500.
2. Everything else — HttpExceptions pass through with their real
   status; anything unrecognized becomes a generic 500, logged
   server-side but not leaked to the client.

## Known deliberate gaps

- Sorting on GET /incidents — filtering/pagination are implemented;
  sorting was explicitly deferred.
- Docker deployment untested — docker-compose.yml still describes
  the original apps/api/apps/worker monorepo layout, which no longer
  matches this repo. The app has been run via npm run start:dev
  directly all week; only Postgres/Redis have ever run in containers.
  This is the most significant honest gap going into the Day 7 review.
- Audit log has no frontend — API-only (GET /audit-logs, ADMIN),
  scoped to team membership changes only (not every mutation).