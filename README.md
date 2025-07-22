
# 🧪 Sandbox API Virtualization SaaS

A **production-grade backend-only SaaS** that enables fintech teams to provision **isolated, dynamic API sandbox environments** for testing, simulating, and mocking third-party services like **KYC, fraud, payments, and more**.

---

## 🔧 Features

* 🔁 Isolated sandbox environments on demand
* 📄 OpenAPI v3-based contract mocking
* 🧠 Stateful simulation plugins (e.g., KYC, fraud checks, balance tracking)
* 🔐 JWT-based auth with granular **RBAC**: Owner, Admin, Developer, Viewer
* 📜 Audit logging, billing, and CI/CD automation
* 🛠️ Admin endpoints for user and team management
* 🖥️ CLI tool for sandbox automation and CI integration
* 📦 Fully Dockerized and scalable (PostgreSQL + Redis)

---

## ⚙️ Tech Stack

* **Backend:** Node.js, TypeScript, NestJS
* **Database:** PostgreSQL + TypeORM
* **Cache/State:** Redis
* **DevOps:** Docker, GitHub Actions
* **Billing:** Stripe 

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Start with Docker (PostgreSQL + Redis + API)
docker-compose up --build

# Or run locally (if you already have Postgres/Redis running)
npm run start:dev
```

---

## 📘 API Reference

* **Swagger UI:** [http://localhost:3001/docs](http://localhost:3000/docs)
* **Postman:** See `postman/` folder for collections

### Common Endpoints

| Feature       | Endpoint                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Auth**      | `/auth/signup`, `/auth/login`                                                                          |
| **Sandboxes** | `/sandbox`, `/sandbox/:id`, `/sandbox/:id/state`, `/sandbox/:id` (DELETE)                              |
| **Mocks**     | `/sandbox/:sandboxId/mocks/openapi`, `/sandbox/:sandboxId/mocks/custom`, `/sandbox/:sandboxId/api/...` |
| **Logs**      | `/logs` — Filter by user, sandbox, route, or date                                                      |
| **Billing**   | `/billing/subscribe`, `/billing/subscription`, `/billing/webhook`                                      |
| **CI/CD**     | `/ci-tokens` — Create/list/revoke tokens                                                               |
| **Admin**     | `/admin/users`, `/admin/users/invite`, `/admin/teams`, role changes, removal                           |

---

## 🛠️ CLI Tool

* Install: `npm run cli` or use via `npx sandbox-api-cli`
* Set environment vars:

  ```bash
  export SANDBOX_API_URL=http://localhost:3000
  export SANDBOX_API_TOKEN=<your_token>
  ```

### CLI Commands

```bash
sandbox-api-cli sandbox list
sandbox-api-cli sandbox create <name>
sandbox-api-cli sandbox delete <id>

sandbox-api-cli ci-token list
sandbox-api-cli ci-token create "<desc>"
sandbox-api-cli ci-token revoke <token>
```

---

## 🧩 Project Structure

```
src/
├── modules/        # Domain modules (auth, users, sandboxes, etc.)
├── cli/            # CLI tool logic
├── middleware/     # Global middleware (rate-limiting, logging)
├── utils/          # Shared utils (Redis, logger, etc.)
docker/             # Docker Compose and config files
```

---

## 🔐 Security & Access Control

* JWT + refresh token flow
* Role-based access: **Owner**, **Admin**, **Developer**, **Viewer**
* Rate limiting, input validation, sanitization
* Multi-tenant data isolation and audit logging

---

## 💳 Billing (Stripe or Mocked)

* Plans: Free → Starter → Pro
* Each plan defines:

  * Sandbox retention period
  * Rate limits per sandbox
  * Access to premium mocks (e.g., fraud engine)

---

## 🧪 CI/CD Ready

* GitHub Actions for lint, test, and Docker builds
* Deploy-ready via Render, Fly.io, or your own infra
* Use CI tokens to auto-provision sandboxes in pipelines



