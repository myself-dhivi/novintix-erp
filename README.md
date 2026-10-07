# Novintix ERP

Novintix ERP is a modular business operations platform for sales, recruitment, finance, file management, and administration. This TypeScript monorepo contains a Next.js web app, an Express API, shared contracts, PostgreSQL persistence, Redis/BullMQ foundations, and Socket.IO real-time events.

> **Status:** Phase 1 foundation. Core workflows are implemented; production hardening and integrations remain on the roadmap. See [PRD.md](PRD.md) for scope, requirements, and release criteria.

## Features

- Permission-aware dashboard with operational and financial summaries
- CRM lead pipeline with search, filtering, assignment, priorities, and status tracking
- Follow-up scheduling for calls, email, meetings, WhatsApp, demos, visits, and tasks
- Recruitment job openings and candidate stage pipeline
- Finance workflows for customers, vendors, invoices, payments, expenses, and approvals
- File workspace with upload, download, preview, progress, validation, and soft deletion
- User administration and editable role-permission matrices
- Short-lived JWT access tokens with rotated HTTP-only refresh cookies
- Audit records for sensitive operations and typed Socket.IO business events

## Technology stack

| Area                 | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| Frontend             | Next.js 16, React 19, TypeScript, Tailwind CSS 4     |
| Client data          | TanStack Query, Axios, Zustand, React Hook Form, Zod |
| Backend              | Node.js 22, Express 5, TypeScript, Zod               |
| Data                 | PostgreSQL 16, Prisma 6                              |
| Real time            | Socket.IO                                            |
| Jobs/cache           | Redis 7 and BullMQ foundation                        |
| Security             | JWT, bcrypt, Helmet, CORS, rate limiting, RBAC       |
| Local infrastructure | Docker Compose                                       |

## Repository structure

```text
novintix-erp/
|- frontend/                 Next.js application
|  `- src/
|     |- app/                Routes and layouts
|     |- components/         UI, shared, and file components
|     |- features/           Feature providers
|     |- hooks/              Upload/download hooks
|     |- lib/                API, socket, and transfer clients
|     `- stores/             Zustand state
|- backend/                  Express API
|  |- prisma/                Schema, migrations, and seed
|  `- src/
|     |- modules/            Auth, admin, CRM, recruitment, finance, files
|     |- middleware/         Authentication, authorization, errors
|     |- realtime/           Socket.IO authentication and rooms
|     |- storage/            Storage-provider abstraction
|     `- queues/             BullMQ queue foundation
|- packages/shared/          Shared permissions, events, and API types
|- docker-compose.yml        PostgreSQL, Redis, API, and web services
`- PRD.md                    Product requirements document
```

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop, or local PostgreSQL 16 and Redis 7 instances

## Local development

1. Create local environment files:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env.local
   ```

2. Replace both JWT secrets in `backend/.env` with different random values of at least 32 characters. Review the seed administrator credentials as well.

3. Install dependencies and start the infrastructure:

   ```powershell
   npm install
   docker compose up -d postgres redis
   ```

4. Generate the Prisma client, apply migrations, and seed roles and the administrator:

   ```powershell
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start the frontend and backend:

   ```powershell
   npm run dev
   ```

Open `http://localhost:3000`. The API is at `http://localhost:4000/api`; database health is available at `http://localhost:4000/api/health`.

### Seed administrator

Unless overridden by `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, the seed creates:

```text
Email:    admin@novintix.local
Password: ChangeMe123!
```

Change this password before using the application outside an isolated local environment. The seed creates the standard roles and permissions, but only this one user.

### Complete development stack in Docker

After creating `backend/.env`, run:

```powershell
docker compose up
```

The Compose setup bind-mounts the repository and is intended for development. Database data, Redis data, and local uploads use named volumes.

## Environment variables

### Backend

| Variable                   | Required  | Default/example          | Purpose                                       |
| -------------------------- | --------- | ------------------------ | --------------------------------------------- |
| `NODE_ENV`                 | No        | `development`            | Runtime mode                                  |
| `PORT`                     | No        | `4000`                   | API port                                      |
| `DATABASE_URL`             | Yes       | PostgreSQL URL           | Prisma database connection                    |
| `JWT_ACCESS_SECRET`        | Yes       | No safe default          | Access signing secret; minimum 32 characters  |
| `JWT_REFRESH_SECRET`       | Yes       | No safe default          | Refresh signing secret; minimum 32 characters |
| `JWT_ACCESS_EXPIRES_IN`    | No        | `15m`                    | Access-token lifetime                         |
| `JWT_REFRESH_EXPIRES_DAYS` | No        | `7`                      | Refresh-token lifetime                        |
| `FRONTEND_URL`             | No        | `http://localhost:3000`  | Allowed CORS origin                           |
| `STORAGE_PROVIDER`         | No        | `LOCAL`                  | File storage provider                         |
| `LOCAL_UPLOAD_PATH`        | No        | `./uploads`              | Local file storage path                       |
| `REDIS_URL`                | No        | `redis://localhost:6379` | Redis connection                              |
| `MAX_UPLOAD_SIZE_MB`       | No        | `10`                     | Upload limit per file                         |
| `SEED_ADMIN_EMAIL`         | Seed only | `admin@novintix.local`   | Seed administrator email                      |
| `SEED_ADMIN_PASSWORD`      | Seed only | `ChangeMe123!`           | Seed administrator password                   |

### Frontend

| Variable                 | Example                     | Purpose                      |
| ------------------------ | --------------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL`    | `http://localhost:4000/api` | Browser-facing API base URL  |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000`     | Browser-facing Socket.IO URL |

## Commands

Run these from the repository root:

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start frontend and backend in watch mode      |
| `npm run dev:frontend` | Start only Next.js                            |
| `npm run dev:backend`  | Start only the API                            |
| `npm run build`        | Build shared contracts, backend, and frontend |
| `npm run start`        | Start built frontend and backend applications |
| `npm run typecheck`    | Type-check all workspaces                     |
| `npm run lint`         | Lint the frontend                             |
| `npm run format`       | Format the repository with Prettier           |
| `npm run format:check` | Check formatting without changes              |
| `npm run db:generate`  | Generate the Prisma client                    |
| `npm run db:migrate`   | Run Prisma development migrations             |
| `npm run db:seed`      | Seed permissions, roles, and administrator    |

## Product modules

| Module      | Main capabilities                                                      | Route             |
| ----------- | ---------------------------------------------------------------------- | ----------------- |
| Dashboard   | Permission-aware KPIs, follow-ups, lead pipeline, finance snapshot     | `/dashboard`      |
| Leads       | Create, search, update, assign, archive, and move leads through stages | `/leads`          |
| Follow-ups  | Schedule and track customer activities                                 | `/followups`      |
| Recruitment | Manage openings and candidate stages                                   | `/recruitment`    |
| Finance     | Manage parties, invoices, payments, expenses, and approvals            | `/finance`        |
| Files       | Upload, preview, download, and soft-delete documents                   | `/files`          |
| Users       | Create, update, deactivate, and assign roles                           | `/settings/users` |
| Roles       | View roles and update permission matrices                              | `/settings/roles` |

## API overview

Business routes require authentication and enforce the relevant permission on the server.

| Base path          | Capabilities                                              |
| ------------------ | --------------------------------------------------------- |
| `/api/auth`        | Login, refresh, logout, current user, password change     |
| `/api/leads`       | Lead list/detail, create, update, archive                 |
| `/api/followups`   | Follow-up list, create, update, delete                    |
| `/api/recruitment` | Jobs and candidate CRUD/stage movement                    |
| `/api/finance`     | Summary, customers, vendors, invoices, payments, expenses |
| `/api/files`       | Metadata, multipart upload, download, soft delete         |
| `/api/admin`       | Users, roles, permissions, role-permission updates        |
| `/api/health`      | Database health check                                     |

Successful responses use `{ success: true, data, message? }`; failures use `{ success: false, message, errors? }`. Access tokens are returned to the client; refresh tokens are rotated in HTTP-only cookies.

## Roles and permissions

The seed provisions `SUPER_ADMIN`, `ADMIN`, `SALES_MANAGER`, `SALES_EXECUTIVE`, `HR_MANAGER`, `RECRUITER`, `FINANCE_MANAGER`, `ACCOUNTANT`, and `VIEWER`.

Permissions are defined in `packages/shared/src/permissions.ts`. The frontend uses them to tailor navigation and actions; the backend remains the authorization authority.

## Files and real-time updates

The local provider validates uploaded content, stores it outside the public web root, records metadata and checksums, and serves downloads through authenticated endpoints. The UI maintains a global transfer queue with progress, retry, cancellation, and a three-transfer concurrency limit.

Socket.IO connections authenticate with the access token and support user/file rooms. Typed events cover file lifecycle changes and major CRM, recruitment, finance, and notification events.

## Current limitations

- `LOCAL` is the only implemented storage adapter. S3, R2, Azure Blob, and GCS values are placeholders; direct/presigned uploads return a configuration error.
- Forgot-password returns a privacy-safe acknowledgement, but reset-token delivery and reset execution are not configured.
- Redis/BullMQ infrastructure exists, but background workers and retention cleanup are not implemented.
- Audit and notification data foundations exist, but complete end-user screens and APIs do not.
- Automated unit, integration, and end-to-end test suites are not included yet.
- The Compose file is a development environment, not a production deployment specification.

## Documentation

- [Product requirements document](PRD.md)
- [Prisma schema](backend/prisma/schema.prisma)
- [Permission catalogue](packages/shared/src/permissions.ts)

## License

No license has been declared. Treat this repository as proprietary unless the project owner specifies otherwise.
