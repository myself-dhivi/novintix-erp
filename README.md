# Novintix ERP — Phase 1 foundation

A production-oriented Next.js + Express monorepo foundation for the Novintix ERP suite. The existing `frontend/` and `backend/` applications remain independently deployable; `packages/shared/` contains only cross-app contracts.

## Included

- Short-lived JWT access tokens and rotated HTTP-only refresh cookies
- Prisma/PostgreSQL users, roles, permissions, refresh tokens, audit logs, notifications, files, and entity attachments
- Backend-enforced RBAC and permission-aware frontend navigation
- A single Axios client with refresh deduplication, request replay, normalized errors, cancellation, and transfer progress
- Authenticated Socket.IO singleton with user rooms, authorized file rooms, reconnect reconciliation, and typed events
- Storage-provider interface plus path-safe local storage
- Central upload/download/delete APIs with MIME/extension/signature validation, checksums, audit records, and soft deletion
- Three-at-a-time global transfer queue with progress, retry, cancel, minimize, and clear controls
- Redis/BullMQ queue foundation and Docker services
- Responsive login, protected dashboard, and file-management workspace
- CRM leads and follow-ups with status workflows and server-side search
- Recruitment jobs and candidate Kanban stages
- Finance invoices, payments, server-calculated tax totals, expenses, and approvals
- User administration plus editable role/permission matrices

## Local setup

Requirements: Node.js 22+, Docker Desktop (or local PostgreSQL 16 and Redis 7).

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
npm install
docker compose up -d postgres redis
npm run db:generate
npm run db:migrate -- --name phase1
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The default development account is:

```text
admin@novintix.local
ChangeMe123!
```

A restricted RBAC demonstration account is also seeded in the local database:

```text
sales@novintix.local
SalesDemo123!
```

Change the seed password and both JWT secrets before any shared deployment.

## Useful commands

```bash
npm run typecheck
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
docker compose up
```

The frontend reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`. The backend validates all required environment variables at startup; see [`backend/.env.example`](backend/.env.example).

## API surface

- `POST /api/auth/login`, `/logout`, `/refresh`, `/change-password`, `/forgot-password`, `/reset-password`
- `GET /api/auth/me`
- `GET /api/files`, `/files/:id`, `/files/:id/download`
- `POST /api/files/upload`, `/files/presigned-upload`, `/files/:id/complete`
- `DELETE /api/files/:id`
- `GET /api/health`

Object-storage signed upload endpoints intentionally return a clear configuration error while `STORAGE_PROVIDER=LOCAL`. Implementations can be added behind `StorageProvider` without changing module code. Physical deletion is intentionally deferred to a retention worker; the API soft-deletes metadata immediately.




to alexander.charles@novintix.com
cc: sathya.selvaraj@novintix.com , roobankumar.r@novintix.com