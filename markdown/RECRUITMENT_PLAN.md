# VA Recruitment Platform — Complete Build Plan

**Timeline:** 3 months (12 weeks) | **Role:** Sole Founding Full-Stack Engineer

---

## 1. Full Tech Stack

### Frontend

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui (speeds up building forms, dialogs, dropdowns)
- **Forms/validation:** React Hook Form + Zod
- **State/data fetching:** TanStack Query (React Query) for API calls/caching
- **Icons:** Lucide React

### Backend

- **Runtime:** Next.js API routes (keep it a monolith — don't split into microservices yet)
- **ORM:** Prisma
- **Auth:** NextAuth.js (or Clerk if you want less setup work) — must support role-based access (seeker / employer / admin)
- **Validation:** Zod (shared between frontend and backend schemas)

### Database

- **Primary DB:** PostgreSQL
- **Hosting:** Supabase or Neon (both have generous free tiers, easy Prisma integration)
- **Search:** Postgres full-text search (`tsvector`/`tsquery`) for MVP — do NOT add Algolia/Meilisearch yet

### Storage & Communication

- **File storage:** Supabase Storage (resumes, company logos)
- **Email:** Resend (application confirmations, job alerts, admin notices)
- **Payments:** Stripe (or PayMongo if you want local PH payment methods like GCash)

### Hosting & DevOps

- **Hosting:** Vercel (pairs natively with Next.js)
- **Version control:** GitHub
- **Environment management:** Vercel env variables + `.env.local` locally

### Dev Tools

- VS Code + GitHub Copilot / Gemini (already in your workflow)
- Prisma Studio (visual DB browser — huge time-saver for a solo dev)
- Postman or Thunder Client (API testing)

---

## 2. Database Schema

### `users`

| Field         | Type                            | Notes                        |
| ------------- | ------------------------------- | ---------------------------- |
| id            | uuid (PK)                       |                              |
| email         | string, unique                  |                              |
| password_hash | string                          | nullable if using OAuth only |
| role          | enum: seeker / employer / admin |                              |
| created_at    | timestamp                       |                              |
| updated_at    | timestamp                       |                              |

### `seeker_profiles`

| Field              | Type              | Notes                                        |
| ------------------ | ----------------- | -------------------------------------------- |
| id                 | uuid (PK)         |                                              |
| user_id            | uuid (FK → users) | 1:1                                          |
| full_name          | string            |                                              |
| phone              | string            |                                              |
| location           | string            |                                              |
| headline           | string            | e.g. "Experienced VA — Admin & Social Media" |
| bio                | text              |                                              |
| resume_url         | string            |                                              |
| skills             | string[]          |                                              |
| desired_salary_min | int               |                                              |
| desired_salary_max | int               |                                              |
| profile_visibility | boolean           | "open to work" toggle                        |
| created_at         | timestamp         |                                              |

### `companies`

| Field           | Type                                | Notes                  |
| --------------- | ----------------------------------- | ---------------------- |
| id              | uuid (PK)                           |                        |
| user_id         | uuid (FK → users)                   | employer account owner |
| company_name    | string                              |                        |
| logo_url        | string                              |                        |
| description     | text                                |                        |
| website         | string                              |                        |
| industry        | string                              |                        |
| verified_status | enum: pending / approved / rejected | admin-controlled       |
| created_at      | timestamp                           |                        |

### `jobs`

| Field           | Type                                           | Notes |
| --------------- | ---------------------------------------------- | ----- |
| id              | uuid (PK)                                      |       |
| company_id      | uuid (FK → companies)                          |       |
| title           | string                                         |       |
| description     | text                                           |       |
| category        | string                                         |       |
| employment_type | enum: full-time / part-time / contract         |       |
| salary_min      | int                                            |       |
| salary_max      | int                                            |       |
| location        | string                                         |       |
| remote_type     | enum: remote / onsite / hybrid                 |       |
| status          | enum: draft / pending_review / active / closed |       |
| created_at      | timestamp                                      |       |
| expires_at      | timestamp                                      |       |

### `applications`

| Field      | Type                                                       | Notes    |
| ---------- | ---------------------------------------------------------- | -------- |
| id         | uuid (PK)                                                  |          |
| job_id     | uuid (FK → jobs)                                           |          |
| seeker_id  | uuid (FK → seeker_profiles)                                |          |
| status     | enum: applied / shortlisted / interview / rejected / hired |          |
| cover_note | text                                                       | optional |
| applied_at | timestamp                                                  |          |
| updated_at | timestamp                                                  |          |

### `saved_jobs`

| Field     | Type      | Notes |
| --------- | --------- | ----- |
| id        | uuid (PK) |       |
| seeker_id | uuid (FK) |       |
| job_id    | uuid (FK) |       |
| saved_at  | timestamp |       |

### `job_alerts`

| Field     | Type                 | Notes |
| --------- | -------------------- | ----- |
| id        | uuid (PK)            |       |
| seeker_id | uuid (FK)            |       |
| keywords  | string               |       |
| category  | string               |       |
| frequency | enum: daily / weekly |       |

### `notifications`

| Field       | Type      | Notes                            |
| ----------- | --------- | -------------------------------- |
| id          | uuid (PK) |                                  |
| user_id     | uuid (FK) |                                  |
| type        | string    | e.g. "application_status_change" |
| message     | text      |                                  |
| read_status | boolean   |                                  |
| created_at  | timestamp |                                  |

### `subscriptions` _(Month 3 — payments)_

| Field                  | Type                                | Notes |
| ---------------------- | ----------------------------------- | ----- |
| id                     | uuid (PK)                           |       |
| company_id             | uuid (FK)                           |       |
| plan_type              | string                              |       |
| status                 | enum: active / cancelled / past_due |       |
| stripe_customer_id     | string                              |       |
| stripe_subscription_id | string                              |       |

**Key relationships:**
`users` 1—1 `seeker_profiles` OR `companies` (depending on role) → `companies` 1—many `jobs` → `jobs` 1—many `applications` ← `seeker_profiles`

---

## 3. Page / Route List

### Public

- `/` — Landing page
- `/jobs` — Browse/search jobs
- `/jobs/[id]` — Job detail page
- `/companies/[id]` — Company profile page
- `/login`
- `/signup` — Role selection: seeker or employer

### Job Seeker (protected)

- `/seeker/dashboard`
- `/seeker/profile`
- `/seeker/profile/edit`
- `/seeker/applications` — Track status
- `/seeker/saved-jobs`
- `/seeker/alerts`

### Employer (protected)

- `/employer/dashboard`
- `/employer/company-profile`
- `/employer/jobs` — List own postings
- `/employer/jobs/new`
- `/employer/jobs/[id]/edit`
- `/employer/jobs/[id]/applicants`
- `/employer/billing`

### Admin (protected)

- `/admin/dashboard`
- `/admin/employers` — Approve/reject
- `/admin/jobs` — Moderate postings
- `/admin/users`

### API Routes

- `/api/auth/*`
- `/api/jobs` (GET, POST)
- `/api/jobs/[id]` (GET, PATCH, DELETE)
- `/api/applications` (GET, POST, PATCH)
- `/api/companies` (GET, POST, PATCH)
- `/api/admin/*`
- `/api/webhooks/stripe`

---

## 4. Week-by-Week Task Breakdown (12 Weeks)

### Month 1 — Foundation

- **Week 1:** Repo setup, Next.js + Tailwind init, Postgres + Prisma connected, hosting accounts created (Vercel, Supabase, Resend, Stripe)
- **Week 2:** Auth system with role-based access, database schema migrated, base layout/navigation for all 3 roles
- **Week 3:** Seeker profile creation + resume upload; employer company registration form
- **Week 4:** Job posting CRUD (employer side) + basic admin approval workflow

### Month 2 — Core Marketplace

- **Week 5:** Job browse/search/filter with Postgres full-text search
- **Week 6:** Application flow — apply, one-click using saved profile, status tracking
- **Week 7:** Employer applicant management dashboard (shortlist, reject, move stages)
- **Week 8:** Email notifications wired in (Resend) — confirmations, status updates

### Month 3 — Monetization + Launch Prep

- **Week 9:** Stripe integration — job posting fees / subscription tiers
- **Week 10:** Saved jobs, job alerts, basic admin analytics dashboard
- **Week 11:** SEO pass (structured data for job postings, sitemap, meta tags), responsive/UI polish
- **Week 12:** Testing, bug fixes, security review, deployment, launch checklist

---

## 5. Project Setup Checklist (Do This First)

- [ ] Create GitHub repo
- [ ] `npx create-next-app@latest` (TypeScript + Tailwind + App Router)
- [ ] Set up Supabase or Neon project → get connection string
- [ ] `npx prisma init` → define schema from Section 2 → `npx prisma migrate dev`
- [ ] Set up NextAuth.js with role field in session/JWT
- [ ] Create `.env.local` with: `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [ ] Set up Vercel project, connect GitHub repo for auto-deploy
- [ ] Create basic folder structure:

```
/app
  /(public)
  /seeker
  /employer
  /admin
  /api
/components
/lib
/prisma
  schema.prisma
```

- [ ] Draft Terms of Service + Privacy Policy (needed before collecting resumes/PII)
- [ ] Register business entity if accepting real payments (needed for Stripe/PayMongo verification — this can take days, start early)

---

## 6. Suggested Next Steps After This Doc

1. Run through the setup checklist (Section 5)
2. Implement Week 1 tasks
3. Come back for help with: Prisma schema code, specific page components, Stripe webhook handling, or auth role logic — whichever you hit first
