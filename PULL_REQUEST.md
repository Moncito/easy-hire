# Pull Request: P0 MVP Platform — Employer ATS, Admin Trust Ops, Seeker Apply Flow

## Overview

This pull request delivers the first complete hiring loop for EasyHire VA Solutions: employers can post and manage jobs, admins verify employers and approve listings, seekers discover roles on a public job board and apply with real profile data, and approved applications surface on the employer Kanban pipeline.

The work spans Sprint 1 through Sprint 3 of the build plan, plus company verification gating to align public visibility with employer trust requirements.

## Objectives

- Replace stub employer and seeker experiences with production-ready workflows backed by Prisma and shared `/lib` services
- Enforce admin approval for job listings before they become publicly visible
- Enforce company verification before jobs can go live on `/jobs`
- Close the MVP loop: post, approve, discover, apply, review on Kanban
- Establish reusable patterns for Zod validation, thin API routes, and role-gated layouts

## Architecture

- Monolith; business logic lives in `/lib`, API route handlers stay thin
- Zod schemas shared between client and server under `/lib/validations`
- Postgres-backed job search with FTS fallback via Prisma
- Supabase Storage for resume and company logo uploads (server-side service role)
- Resend for transactional email on new applications
- JWT session role synced from database on each request (supports manual ADMIN promotion)

## Database and Migrations

### Schema updates (`prisma/schema.prisma`)

- **Jobs:** `requirements`, `benefits`, `published_at`, `expires_at`, FTS `search_vector`
- **Applications:** `internal_notes`, `rating`, `rejection_reason`
- **Companies:** extended profile fields (team size, headquarters, highlights, social URLs)
- **Seeker profiles:** `availability`, `years_experience`

### Migrations included

- `20260723162544_add_company_profile_fields`
- `20260727200000_sprint1_job_application_fields`

**Deploy locally (stop dev server first):**

```bash
npx prisma migrate deploy && npx prisma generate
```

## Backend — New and updated `/lib` services

| Module | Purpose |
|--------|---------|
| `lib/jobs.ts` | Job CRUD, draft submit, status transitions |
| `lib/applications.ts` | Application create (seeker apply), update, list |
| `lib/companies.ts` | Employer company profile updates |
| `lib/seekers.ts` | Seeker profile read/update, application status lookup |
| `lib/public-jobs.ts` | Public job search, detail (verified employers only) |
| `lib/public-companies.ts` | Public company page data |
| `lib/admin/jobs.ts` | Pending job queue, approve/reject |
| `lib/admin/companies.ts` | Pending company queue, verify/reject |
| `lib/email.ts` | Resend notifications on application submit |
| `lib/storage.ts` | Supabase upload helpers (resumes, logos) |
| `lib/employer-auth.ts` / `lib/seeker-auth.ts` / `lib/admin-auth.ts` | Role-scoped access guards |
| `lib/api-error.ts` | Consistent API error responses |
| `lib/format.ts` | PHP salary and enum formatting |

## API Routes

### Employer

- `GET/PATCH /api/jobs/[id]` — job read/update (employer-scoped)
- `POST /api/jobs` — create job
- `PATCH /api/jobs/[id]/submit` — `DRAFT` → `PENDING_REVIEW`
- `PATCH /api/company` — company profile update
- `GET /api/jobs/[id]/applications` — list applicants for a job
- `PATCH /api/applications/[id]` — Kanban status, notes, rating, rejection reason

### Admin

- `GET /api/admin/jobs` — pending job queue
- `PATCH /api/admin/jobs/[id]` — approve/reject job (blocked until company verified)
- `GET /api/admin/companies` — pending company verification queue
- `PATCH /api/admin/companies/[id]` — verify/reject company

### Public

- `GET /api/jobs/search` — FTS search, filters, keyset pagination
- `GET /api/public/jobs/[id]` — public job detail (ACTIVE + verified employer)

### Seeker

- `GET/POST /api/applications` — apply + check existing application by `jobId`
- `GET/PATCH /api/profile/seeker` — profile CRUD
- `POST /api/upload/resume` — resume upload to Supabase

### Uploads

- `POST /api/upload/logo` — company logo upload to Supabase

## Admin Console

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Stats: companies to verify, jobs to review, public live jobs |
| `/admin/companies` | Employer verification queue with approve/reject |
| `/admin/jobs` | Job approval queue; approve disabled until company is verified |

### Two-step trust model

1. Admin verifies employer company (`Company.verifiedStatus` → `APPROVED`)
2. Admin approves individual job posts (`Job.status` → `ACTIVE`)

Public visibility requires **both**. Jobs from unverified companies are hidden from `/jobs` even if previously marked ACTIVE.

**Admin access:** No self-serve admin signup. Promote a user to `role = ADMIN` in the database, then sign in with that account. JWT role refreshes from DB on each request.

## Employer Portal

| Route | Description |
|-------|-------------|
| `/employer/dashboard` | Hiring stats, recent jobs, profile completion, verification banners |
| `/employer/jobs` | Job list with status badges |
| `/employer/jobs/new`, `/employer/jobs/[id]/edit` | Job form with requirements, benefits, submit-for-review |
| `/employer/jobs/[id]/applicants` | Kanban applicant board |
| `/employer/applicants` | Cross-job applicants view |
| `/employer/company-profile` | Company profile editor with logo upload |

### Employer layout

- Fixed sidebar and topbar shell
- Shared `EmployerPageContainer` for scrollable content
- Kanban layout fixes and custom scrollbar styling

### Applicant Kanban

- Full-height mist columns, per-column empty states
- Collapsed Rejected column
- Candidate drawer with real seeker data, persisted notes and rating

## Seeker Portal

| Route | Description |
|-------|-------------|
| `/seeker/dashboard` | Profile completeness, recent applications |
| `/seeker/profile` | Profile editor with resume upload |

## Public Surfaces

| Route | Description |
|-------|-------------|
| `/jobs` | Job search with filters |
| `/jobs/[id]` | Job detail with apply modal |
| `/companies/[id]` | Public company profile and open roles |

## Authentication changes

- `AuthProvider` (NextAuth `SessionProvider`) added to root layout for client session hooks
- JWT callback re-reads `User.role` from database on each token refresh
- Apply button uses session to gate seeker apply flow

## Dependencies added

- `zod`
- `resend`
- `@supabase/supabase-js`

## Environment variables

Configure in `.env` (not committed):

```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

GOOGLE_ID=
GOOGLE_SECRET=

RESEND_API_KEY=
EMAIL_FROM=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Supabase setup (one-time)

Create public Storage buckets: `resumes`, `logos`

## Employer UX notes

- Topbar shows company verification status (Pending / Verified / Rejected)
- Dashboard banner when company verification is pending
- Active jobs show **Approved — not public** until company is verified

## Known limitations / follow-ups

- Admin users must be promoted manually in the database (no admin signup route)
- Company verification is profile-based; document upload workflow is planned for P1
- `/employer/reports`, messaging, talent search, and Stripe billing are out of scope
- Seeker saved jobs and job alerts are Sprint 9+
- Rejection reasons for company verification are delivered via notifications only (no dedicated DB field yet)

## Test plan

### Prerequisites

- [ ] Run `npx prisma migrate deploy && npx prisma generate`
- [ ] Configure Supabase buckets and env vars for uploads (optional for core loop)
- [ ] Configure `RESEND_API_KEY` for email notifications (optional)
- [ ] Promote a test user to `ADMIN` in Prisma Studio

### Company and job approval

- [ ] Sign up or log in as employer; complete company profile
- [ ] Confirm employer topbar shows **Pending review**
- [ ] As admin, verify company at `/admin/companies`
- [ ] Create job as employer; submit for review
- [ ] As admin, approve job at `/admin/jobs` (enabled only after company verified)
- [ ] Confirm job appears on `/jobs`

### Seeker apply loop

- [ ] Sign up as seeker; upload resume at `/seeker/profile`
- [ ] Apply to job from `/jobs/[id]`
- [ ] Confirm application appears on employer Kanban with real seeker data
- [ ] Confirm employer and seeker receive email if Resend is configured

### Trust gating

- [ ] Attempt to approve job before company verification — expect blocked with clear error
- [ ] Confirm ACTIVE job from unverified company does not appear on `/jobs`
- [ ] After company verification, confirm existing ACTIVE jobs become public

### Regression

- [ ] Employer cannot access another company's jobs or applications
- [ ] Non-admin users cannot access `/admin/*` or admin APIs
- [ ] Sign out and sign in after ADMIN promotion works without stale role errors

## Files of note

- `Auth.ts` — JWT role sync from database
- `app/employer/layout.tsx` — employer shell
- `app/admin/layout.tsx` — admin shell
- `components/employer/KanbanBoard.tsx` — applicant pipeline UI
- `components/jobs/ApplyButton.tsx` — seeker apply modal
- `lib/public-jobs.ts` — public search with verified-employer filter

---

**Branch:** `feature/p0-mvp-platform`  
**Suggested commit message:** see commit body on this branch
