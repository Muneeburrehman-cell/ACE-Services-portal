# Estimation Company Portal

A secure, role-isolated web portal for a US-based construction estimation company.

## Architecture

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) | 3000 |
| Backend API | NestJS 11 (TypeScript) | 4000 |
| Database | PostgreSQL 16 | 5432 |
| Real-time | Socket.IO (chat + notifications) | — |
| File storage | AWS S3 (private bucket, pre-signed URLs) | — |
| Email | SendGrid transactional API | — |

## Security model

Every access-control rule is enforced at **two independent layers**:

1. **NestJS Guards** (`JwtAuthGuard` + `RolesGuard`) — reject at the HTTP layer before any business logic runs.
2. **PostgreSQL Row-Level Security** — `withRlsContext()` on `PrismaService` sets `app.current_user_id` and `app.current_user_role` session variables before every isolated query, so DB policies enforce isolation even if application code has a bug.

Role isolation rules:
- BD agents see only their own projects, status always shown as **"Received"** regardless of internal state.
- Engineers see only projects assigned to them, with **no client name, email, or phone** in any response.
- All employees have exactly **one chat thread** with Admin — the DB `UNIQUE(employee_id)` constraint makes employee-to-employee threads structurally impossible.
- Account lockout applies after 5 failed password attempts (15 min).
- All roles are locked out after 5 failed password attempts (15 min).

## Quick start (local development)

### Prerequisites

- Node.js 18+, npm
- Docker Desktop

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Configure the API

```bash
cd apps/api
copy .env.example .env
# Fill in AWS credentials and SendGrid API key
```

### 3. Run the database migration

```bash
cd apps/api
npm run prisma:migrate       # applies prisma/migrations/0001_initial/migration.sql
npm run prisma:seed           # WARNING: clears all data and creates one admin account
```

The seed creates one admin account. Set `ADMIN_EMAIL` and
`ADMIN_INITIAL_PASSWORD` in `.env` to control the credentials; defaults are:

| Role | Email | Password |
|------|-------|----------|
| Admin | georgeadam2492@gmail.com | Admin@123456 |

The seed is a reset utility, not a non-destructive development fixture. Do not
run it against a database containing data you need to keep.

### 4. Start the API

```bash
cd apps/api
npm run dev        # http://localhost:4000/api
```

### 5. Start the frontend

```bash
cd apps/web
npm run dev        # http://localhost:3000
```

## Running tests

```bash
cd apps/api
npm test                          # all unit tests
npm test -- --no-coverage         # faster (no coverage report)
```

Current unit coverage includes authentication lockout, password failure counting,
refresh-token rotation, hashing, project role isolation, admin views, and
assignment validation.

## Building for production

```bash
# API
cd apps/api && npm run build    # outputs to dist/src/
cd apps/api && npm run start:prod

# Frontend
cd apps/web && npm run build    # outputs to .next/
```

Both `npm run build` complete with zero errors.

## Production deployment checklist

1. **Environment secrets** — set `JWT_SECRET` (256-bit random), `JWT_REFRESH_SECRET`, `CF_R2_*`, and an email provider. Never commit `.env`.
2. **PostgreSQL** — use a managed service (AWS RDS / DigitalOcean Managed Postgres). Run `prisma migrate deploy` (not `dev`) in CI/CD.
3. **RLS policies** — the initial migration (`0001_initial/migration.sql`) installs all RLS policies. Verify with `psql -c "\d+ projects"` that `Row Security: enabled` appears.
4. **S3 bucket** — `BlockPublicAcls: true`, `BlockPublicPolicy: true`, SSE-AES256 default encryption. The app DB user must NOT have `BYPASSRLS`.
5. **Nginx** — SSL termination, `Upgrade: websocket` proxy header, HTTP → HTTPS redirect.
6. **Seed password** — change the initial admin password before rollout.

## Project structure

```
Portal/
├── apps/
│   ├── api/                  NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         Login, JWT, 2FA, lockout
│   │   │   ├── users/        User management (Admin only)
│   │   │   ├── projects/     Core workflow, RLS-scoped queries
│   │   │   ├── files/        S3 pre-signed URLs, role-checked
│   │   │   ├── chat/         Socket.IO + RLS-isolated threads
│   │   │   ├── notifications/ Socket.IO + RLS-isolated delivery
│   │   │   ├── delivery/     Send-to-client email (SendGrid)
│   │   │   ├── audit/        Immutable append-only log
│   │   │   └── prisma/       PrismaService with withRlsContext()
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── migrations/0001_initial/migration.sql  ← hand-written + RLS
│   │       └── seed.ts
│   └── web/                  Next.js 14 frontend
│       └── app/
│           ├── login/        Login + 2FA pages
│           ├── reset-password/
│           ├── bd/           BD agent dashboard, submit form, chat
│           ├── engineer/     Engineer dashboard, project detail, chat
│           └── admin/        Full pipeline, users, audit, chat
├── docker-compose.yml        Local PostgreSQL
├── .gitignore
└── README.md
```
