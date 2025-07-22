# Sandbox API Virtualization SaaS

A production-grade backend-only SaaS platform for fintech teams to provision isolated API sandbox environments for testing, simulating, and mocking 3rd-party services (KYC, fraud, payments, etc.).

## Features
- Dynamic sandbox creation and isolation
- Contract-based mocking (OpenAPI v3)
- Stateful simulation plugins (KYC, fraud, balance, etc.)
- Secure JWT auth with RBAC (Owner, Admin, Developer, Viewer)
- Audit logging, billing, and CI/CD integration
- Admin endpoints for user/team management
- CLI tool for automation and CI/CD
- Dockerized, scalable, and production-ready

## Tech Stack
- Node.js + TypeScript + NestJS
- PostgreSQL (TypeORM)
- Redis (state/cache)
- Docker, GitHub Actions, Stripe (or mock)

## Setup
```bash
# Clone and install
npm install

# Copy and edit .env
cp .env.example .env

# Start with Docker Compose
# (Postgres, Redis, and API)
docker-compose up --build

# Or run locally (requires Postgres/Redis running)
npm run start:dev
```

## API Documentation
- Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)
- Postman collection: See `postman/` directory

## Usage Examples
- **Auth:** `/auth/signup`, `/auth/login`
- **Sandbox:** `/sandbox` (create), `/sandbox/:id` (inspect), `/sandbox/:id/state` (start/stop/reset), `/sandbox/:id` (delete)
- **Mocks:** `/sandbox/:sandboxId/mocks/openapi` (upload spec), `/sandbox/:sandboxId/mocks/custom` (custom mock), `/sandbox/:sandboxId/api/...` (mocked endpoints)
- **Logs:** `/logs` (query logs, filter by sandbox/user/date/route)
- **Billing:** `/billing/subscribe`, `/billing/subscription`, `/billing/webhook`
- **CI/CD:** `/ci-tokens` (list, create, revoke tokens)
- **Admin:** `/admin/users` (list), `/admin/users/invite`, `/admin/users/:userId` (remove), `/admin/users/:userId/role` (change role), `/admin/teams`, `/admin/teams/:teamId`

## CLI Tool
- Install: `npm run cli` or `npx sandbox-api-cli`
- Usage:
  - `sandbox-api-cli sandbox list`
  - `sandbox-api-cli sandbox create <name>`
  - `sandbox-api-cli sandbox delete <id>`
  - `sandbox-api-cli ci-token list`
  - `sandbox-api-cli ci-token create <desc>`
  - `sandbox-api-cli ci-token revoke <token>`
- Set `SANDBOX_API_URL` and `SANDBOX_API_TOKEN` env vars for API URL and authentication.

## Architecture Overview
- `src/modules/` — Domain modules (auth, users, sandboxes, mocks, simulations, logs, payments, ci-integrations)
- `src/cli/` — CLI tool for automation and CI/CD
- `src/middleware/` — Global middleware (rate limiting, logging, etc.)
- `src/utils/` — Shared utilities (Redis, etc.)
- `docker/` — Docker and deployment configs

## Security & RBAC
- JWT with expiry, refresh, and RBAC (Owner, Admin, Developer, Viewer)
- Rate limiting, input validation, and sanitization
- Tenant isolation and audit logging
- All sensitive endpoints protected by RBAC

## Stripe Billing (or Mock)
- Tiered plans: Free, Starter, Pro
- Rate limits and retention per tier
- Endpoints for subscription management and webhook handling

## CI/CD
- GitHub Actions: Runs tests and lints on push/PR
- Dockerized for Render/Fly.io/Cloud
- CI tokens for automation

## Contributing
PRs welcome! See `CONTRIBUTING.md`.

---
MIT License
