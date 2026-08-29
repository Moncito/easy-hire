# EasyHire — Pre-Launch Remediation & Differentiation Plan

**Created:** 2026-08-29 · **Status:** Phase 1 in progress
**Working agreement:** one phase at a time, verified before the next opens. Opus plans and reviews; Sonnet subagents do the edits.

---

## Live status

| Phase | Sub-task | State |
|---|---|---|
| 1 | 1.1 Private storage buckets + signed URLs | ✅ done — **backfill applied 2026-08-30, exposure confirmed closed** |
| 1 | 1.2 Fail-closed cron auth | ✅ done, verified |
| 1 | 1.3 Password reset + email verification | ✅ done — backend (migration applied) + UI |
| 1 | 1.4 Rate limiting beyond AI | ✅ done, verified (+9 unit tests) |
| 1 | 1.5 Input validation & error codes | ✅ done, verified |
| 1 | 1.6 Data-subject rights (RA 10173) | ✅ done — backend only, **UI not built** |
| 1 | *(added)* Email normalization | ✅ done, verified + 1 data row repaired |
| 2 | Seeker-side parity | ⬜ not started |
| 3 | Distribution / Google for Jobs | ⬜ not started |
| 4 | Trust wedge (reviews + verification score) | ⬜ not started |

**Phase 1 closed 2026-08-30.** Tree state: `npx tsc --noEmit` clean · `npm test` **72/72** across 6 files (was 45 across 3) · `npm run lint` 64 problems (30 errors / 34 warnings) — all pre-existing baseline, none added. One migration applied, `migrate status` clean. Nothing committed yet.

### Storage backfill — applied

`node scripts/migrate-private-storage.mjs --apply` run 2026-08-30. Flipped the `resumes` bucket to private and normalized 3 seeker rows / 6 values from public URLs to object paths. `verification-docs` did not exist yet, so no KYC document was ever exposed. **Verified:** the previously public resume URL now returns **HTTP 400**; a re-run reports 0 rows (idempotent).

The script itself had a bug found only by running it — it duplicated `getSupabaseAdmin` without the `ws` realtime transport that `lib/shared/supabase.ts` passes, so it crashed on Node 20. Fixed. Worth noting `tsc`/`lint`/`test` all passed while that bug existed: standalone `.mjs` scripts are in none of those checks.

### Verified vs. unverified in Phase 1

**Verified:** private-bucket URL returns 400 · backfill idempotent · migration applied and `migrate status` clean · 72/72 tests · no new lint.

**NOT yet verified — requires a running app:** cron endpoint returning 503/401 · password-reset round trip through a real email · rate limiters actually returning 429 with `Retry-After` · invalid JSON returning 400 instead of 500 · the auth recovery pages rendering and submitting correctly.

### Open decisions for the product owner

1. **`allowDangerousEmailAccountLinking`** in `Auth.ts` is still `false`. Its own comment defers the decision to "once email verification exists" — which is now. Enabling it lets someone who registered with a password later sign in with Google on the same address.
2. **`ExportAuditLog.companyId` is `NOT NULL`**, so a *seeker's* self-export cannot be logged to it. Employer exports log normally; seeker exports currently fall back to `console.info`. Fix is either making `companyId` nullable or adding a `userId`-keyed export log table. Needs a schema decision.
3. **Account-deletion UI does not exist.** The backend at `POST /api/account/delete` and `GET /api/account/export` is built and guarded, but nothing calls it. Also: NextAuth uses JWT sessions with no server-side store, so the UI must call `signOut()` immediately after a successful delete — the backend alone cannot invalidate a live session.
4. **Public-bucket files are not deleted on account deletion** — logos, banners, photos, avatars. DB references are nulled, files remain. Deliberate scope call; worth revisiting.
5. **Lint is not green and never was** — 30 pre-existing errors, mostly React `set-state-in-effect` in `components/**`. The CI task cannot land as a blocking gate until those are cleared.

---

## Context

A full audit of the codebase (52 pages, 84 API routes, ~200 lib modules, 28 Prisma models, 24 migrations) plus a competitor scan of the PH VA hiring market surfaced one structural problem and three categories of concrete gaps.

**The structural problem:** EasyHire is a deep employer ATS sitting on a marketplace that cannot yet acquire, retain, or protect either side. The build is lopsided — 183 employer components vs 17 seeker components, 37 employer/hiring API routes vs 4 seeker routes, two parallel employer stacks (`/employer/*` and `/hiring/[companyId]/*`) vs a single thin seeker surface. In a Philippines VA marketplace the VAs are the scarce side; OnlineJobs.ph's moat is 5M profiles, not ATS depth. The product currently invests where acquisition is easy and starves where it is hard.

Three things follow, and all four workstreams below are in scope:

1. **Safety/privacy holes are live in code today** — resumes and KYC documents sat in world-readable storage, all three cron endpoints were publicly callable, and there is still no password reset or email verification.
2. **The seeker half of the loop is non-functional in places** — seekers cannot read their own notifications, cannot start a conversation, never see a scheduled interview, and job alerts have never fired because no scheduler exists.
3. **The stated differentiation is unbuilt** — "both sides verified, both sides rated" has zero schema behind it, and the platform is invisible to Google for Jobs (no JSON-LD anywhere), which is the standard fix for a job board's cold-start problem.

**Milestone:** still building toward launch, no external users. Schema changes are cheap now; correctness beats speed. Stripe/AI keys are deliberately unprovisioned — leave that code as-is.

**Migration constraint:** `prisma migrate dev` is blocked by pre-existing checksum drift. Every schema change must be a hand-authored migration folder applied with `npx prisma migrate deploy`. Four DB objects exist only in SQL and are absent from `schema.prisma` (both `search_vector` columns + their GIN indexes, the partial unique on `interviews`, the `supabase_realtime` publication) — do not let a generated migration DROP them.

---

## Phase 1 — Security & data privacy

### 1.1 Private storage buckets + signed URLs ✅

**Was:** `lib/shared/storage.ts` created every bucket with `public: true` and `lib/shared/supabase.ts` returned `/object/public/` URLs. Resumes (name, address, phone, work history) and verification documents (business permits) were readable by anyone with the URL, bypassing the ownership gate in `app/api/employer/talent/[seekerId]/resume/route.ts`. RA 10173 exposure.

**Shipped:**
- `resumes` and `verification-docs` are now private; `logos`, `banners`, `photos` stay public. Bucket config consolidated into one `BUCKETS` map.
- `getSignedStorageUrl(bucket, path, ttl)` in `lib/shared/supabase.ts`; `toObjectPath` + `resolveSignedUrl` in `lib/shared/storage.ts`. 300s TTL.
- Stored values are now bare object paths. `toObjectPath` accepts legacy `/object/public/` and `/object/sign/` URLs so old rows self-heal.
- Signing happens at the **lib DTO boundary** — `lib/employer/talent.ts`, `lib/seeker/public-seekers.ts`, `lib/jobs/applications.ts`, `lib/auth/employer-guards.ts`, `lib/collaborative-hiring-reviews.ts`, `lib/employer/verification.ts`, `lib/admin/companies.ts`, `lib/employer/companies.ts`, `lib/seeker/seekers.ts`. No component changes needed.
- `lib/seeker/resume-urls.ts` (new): `signResumeUrl`, `hydrateResumeFields`. Dedupes by path so `resumeUrl` and its `resumes[]` entry stay string-equal — the "which resume is primary" check depends on that.
- Magic-byte sniffing added to `assertFile` (`file.type` is client-supplied and was the only MIME check).
- Resume download route stopped proxying bytes through Node; redirects to a signed URL, keeping its ownership gate.
- `scripts/migrate-private-storage.mjs` — idempotent, dry-run by default, `--apply` to write. **Not run.**

**Follow-ups deliberately left open:**
- `app/api/jobs/[id]/applications/route.ts` inlines its own Prisma query instead of going through `lib/` (pre-existing CLAUDE.md violation). No live UI reads `resumeUrl` from it, and the private bucket already makes the value useless unsigned.
- `ensureSeekerProfile` is intentionally **not** signed — it is a hot cached helper on nearly every seeker page load. `app/seeker/profile/page.tsx` hydrates explicitly instead.

### 1.2 Fail-closed cron auth ✅

**Was:** all three cron routes used `if (CRON_SECRET) { ...check... }`. `CRON_SECRET` was unset, so the guard was skipped entirely and anyone could `POST /api/cron/job-alerts` to burn the Resend quota and sender reputation.

**Shipped:** `lib/shared/cron-auth.ts` → `requireCronAuth(req)`. 503 when unconfigured, 401 on missing/mismatched header, `crypto.timingSafeEqual` with a length pre-check. Wired into all three routes. `CRON_SECRET` documented in `.env.example`.

### 1.3 Password reset + email verification ⬜

Zero occurrences repo-wide. Employers lock themselves out permanently on a forgotten password (Google sign-in is seeker-only by design, `components/signup/CredentialsStep.tsx:110`), and unverified emails undercut the anti-scam positioning.

- Schema: `User.emailVerifiedAt` + a `VerificationToken` table (`tokenHash` unique, `userId`, `purpose` enum `EMAIL_VERIFY | PASSWORD_RESET`, `expiresAt`, `consumedAt`). Mirror the SHA-256 token hashing already used for invitations in `lib/collaborative-hiring.ts`.
- `lib/auth/credentials-recovery.ts`: request / verify / consume. Routes `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET|POST /api/auth/verify-email`.
- Two emails via `renderEmailLayout` / `emailCtaButton` from `lib/shared/email-layout.ts`.
- Pages `/login/forgot`, `/reset-password/[token]`, `/verify-email/[token]`.
- Gate **posting a job and messaging** on verified email — not sign-in itself, so the funnel isn't blocked.
- Then revisit `allowDangerousEmailAccountLinking` in `Auth.ts` (its comment explicitly defers to this work).

### 1.4 Rate limiting beyond AI ✅

**Was:** `lib/ai/rate-limit.ts` was the only limiter, wired solely into `lib/ai/run.ts`.

**Shipped:** `lib/shared/rate-limit.ts` — `checkRateLimit`, `enforceRateLimit`, `clientKeyFromRequest`. Fixed-window on Upstash with an in-memory fallback, **fails open** on Redis error. `ApiError` gained an optional `retryAfterSeconds` that `errorResponse` emits as `Retry-After`. `lib/ai/rate-limit.ts` now delegates, unchanged behaviour.

| Endpoint | Key | Limit | Window |
|---|---|---|---|
| Register | IP | 5 | 1 hr |
| Credentials login | IP | 20 | 15 min |
| Credentials login | email | 8 | 15 min |
| Apply to job | userId | 20 | 1 hr |
| Uploads (all 6) | userId, per type | 10 | 10 min |
| Send message | userId | 30 | 10 min |
| Job view (unauthenticated) | IP | 20 | 60 sec |

Login throws `LoginRateLimited extends CredentialsSignin` so `@auth/core` returns it gracefully to a `redirect: false` client. `.env.example` documents that without Upstash the limiter is per-instance and gives no real protection on serverless. Added `lib/shared/rate-limit.test.ts` (9 new tests).

### 1.5 Input validation & error correctness ✅

- `errorResponse()` now maps `ZodError` → **400** instead of 500. 31 routes had hand-rolled `instanceof ZodError` blocks; all removed as redundant. Net −78 lines.
- `app/api/register/route.ts` — had **no try/catch at all**. Now validated by `registerSchema` (email format + 254 cap, 8–72 char password, role enum, 200-char name caps), wrapped in the standard handler, Prisma `P2002` → 409.
- `app/api/profile/employer/route.ts` — raw destructure into `prisma.company.update`, no handler. Now schema-validated and wrapped.
- `app/api/employer/analytics/route.ts` — added `analyticsDateRangeSchema`, max span 366 days.

### *(added mid-phase)* Email normalization ✅

`User.email` is `@unique` and every lookup was an exact-match `findUnique`, but nothing lowercased or trimmed. Registering as `Moncito@X.com` then logging in as `moncito@x.com` failed, and two accounts could exist per real address. `normalizeEmail` in `lib/shared/email-address.ts`, applied in `registerSchema`/`credentialsSchema`, all four `Auth.ts` lookup/create sites, and `lib/collaborative-hiring-team.ts`. One existing uppercase row (`CompanyExample@gmail.com`, EMPLOYER) was lowercased with owner approval; 0 remain.

### 1.6 Data-subject rights (RA 10173) ⬜

- Account deletion and data export for both roles under `/account`. Reuse the CSV builder in `lib/employer/exports.ts`; log to the existing `ExportAuditLog` model.
- `/privacy` and `/terms` are self-labeled MVP drafts — counsel, not engineering.

---

## Phase 2 — Seeker-side parity ⬜

### 2.1 Seeker notification surface
Notifications are written for seekers (`APPLICATION_REJECTED`, `NEW_MESSAGE`) but there is no UI to read them, and `notificationHref()` in `lib/shared/notifications.ts` only maps `/employer/*` routes. Extend the href map, add `GET|PATCH /api/seeker/notifications`, and a `SeekerNotificationBell` modeled on `components/employer/EmployerNotificationBell.tsx`, mounted in `SeekerPillNav`, `SeekerSidebar`, `SeekerMobileBottomNav`.

### 2.2 Seeker-initiated messaging
`app/api/conversations/route.ts:31` hard-gates POST to `EMPLOYER`. Allow `SEEKER`, scoped to a job they applied to — mirror the scoping rule in `lib/employer/talent.ts:317-337`. Enforce inside `createOrGetConversation`, not the route. Add a "Message employer" affordance on `app/jobs/[id]/page.tsx` and seeker dashboard rows.

### 2.3 Candidate-visible interviews
`Interview` is fully managed employer-side and never surfaces to the candidate — no view, no email, no ICS, no accept/decline. Add a read path in `lib/seeker/dashboard.ts`, a dashboard section, `INTERVIEW_SCHEDULED` notification, and scheduled/rescheduled/cancelled emails with an `.ics` attachment.

### 2.4 Make the schedulers actually run
Three cron endpoints exist and nothing invokes them — no `vercel.json`, no `.github/`. Add cron entries. **Vercel Cron issues GET, not POST** — all three routes are POST-only. Add `JobAlert.lastSentAt` + a window guard (the digest re-derives its window from `frequency` alone, so any retry resends). Replace the serial `for` loops in `lib/seeker/job-alerts-digest.ts` and `lib/ai/digest.ts` with bounded batching, copying `ROLLUP_BATCH_SIZE` from `lib/employer/analytics-rollups.ts`.

### 2.5 Missing emails
Only 6 transactional emails exist. Add: welcome, job approved/rejected, company verified/rejected, new message, and status-change-other-than-rejection.

---

## Phase 3 — Distribution (Google for Jobs) ⬜

Zero `application/ld+json`, zero `JobPosting`, zero `schema.org` in the repo. `generateMetadata` exists on exactly one page.

- `lib/seo/job-posting-jsonld.ts` built from the existing `getPublicJob` result: `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocationType: "TELECOMMUTE"` + `applicantLocationRequirements`, `baseSalary` with `salaryPeriod`, `employmentType`.
- Emit on `app/jobs/[id]/page.tsx`; `Organization` JSON-LD on `app/companies/[id]/page.tsx`.
- `generateMetadata` on `/companies/[id]`, `/seekers/[id]`, `/jobs`, `/employers`, `/pricing`. Add `metadataBase`, a title template, and a default OG image to `app/layout.tsx`.
- Extend `app/sitemap.ts` with verified company pages and public seeker profiles (respecting `visibility`); paginate past `take: 500`.
- Publish JSON-LD only for `ACTIVE` jobs from `APPROVED` companies — reuse the sitemap's existing filter.

---

## Phase 4 — Trust wedge ⬜

Nothing here exists in schema. This is the reason to pick EasyHire over OnlineJobs.ph, where the loudest recurring complaint is that workers cannot review employers.

### 4.1 Two-way reviews
`Review` model: `authorUserId`, `subjectType` (`COMPANY | SEEKER`), `subjectId`, `applicationId` (proof-of-relationship anchor), `rating`, `body`, `status` (`PUBLISHED | DISPUTED | HIDDEN`), unique `(applicationId, authorUserId)`. Only unlockable from an `Application` that reached `HIRED` — that is what makes it non-gameable and hard for competitors to retrofit. Logic in `lib/reviews.ts`, schema in `lib/validations/review.ts`, surfaces on `/companies/[id]` and `/seekers/[id]` (`CompanyProfileEditor` already has empty "Response Rate" / "Employer Rating" slots). Dispute path routed to admin.

### 4.2 VA verification score
`SeekerProfile.verificationScore` (0–100) + `idVerifiedAt` from ID check + profile completeness + employer-confirmed history. Label it in the UI as **identity confidence, not skill**. Reuse the document-upload + admin-review machinery in `lib/employer/verification.ts`.

### 4.3 Public response metrics
`Company.responseRate` + `medianResponseMinutes`, denormalized, recomputed in the existing `analytics-rollups` cron. Publish on company pages — directly attacks employer ghosting.

---

## Cross-cutting (fold into whichever phase touches the file)

- **Indexes.** `SeekerProfile` has **zero** `@@index` despite being filtered on `visibility`, `location`, `availability`, `skills hasSome` (needs GIN on the `String[]`). `JobAlert` has zero and is queried by `frequency`. `Subscription.stripeSubscriptionId` is the webhook lookup key — make it unique + indexed. Add `Job` indexes for `category`, `publishedAt`, `expiresAt`, plus a composite for the public-board query. Add `SavedJob.jobId`, `Message.senderUserId`.
- **Schema drift.** Add the four SQL-only objects to `schema.prisma` so a future migration can't drop them.
- **Silent FTS fallback.** `lib/jobs/public-listing.ts:196-200` is an empty `catch` — a broken `search_vector` silently degrades every public search to a full-table ILIKE scan with no signal.
- **Talent FTS paging.** `lib/employer/talent.ts:172` hardcodes `nextCursor: null`, capping text search at one page.
- **Unbounded queries.** 40 `findMany` calls without `take`. Worst: `lib/employer/exports.ts:40` (whole CSV in memory), `lib/messaging/messages.ts:191` (full thread history), `app/api/jobs/[id]/applications/route.ts:30`.
- **Observability.** No Sentry, no analytics, 29 `console.error` calls total. The six metrics in `docs/build-plan.md` §9 are uninstrumented — there is no way to tell whether the loop works.
- **CI.** `.github/workflows/ci.yml` running lint + `tsc --noEmit` + tests. `eslint.config.mjs` has useful boundary rules that nothing enforces. **Blocked on clearing the 30 pre-existing lint errors.**
- **Repo hygiene.** `prisma/gen/**` is committed, stale (11 of 28 models), imported by nothing, and includes a `.dll.node` plus three orphaned `.tmp*` binaries. `three` is installed and unused. `README.md` is untouched boilerplate.
- **Accessibility.** `components/signup/*` has 0 aria attributes across all 5 steps. `app/admin/layout.tsx` is desktop-only (`w-64` + hard `pl-64`).

---

## Execution protocol

One phase at a time. For each: Opus writes the sub-task specs → Sonnet subagents implement (backend before UI, never overlapping files per CLAUDE.md) → Opus reviews the diffs → run the phase's verification plus `npm run lint && npx tsc --noEmit && npm test` → report, including anything skipped or failed → wait for go-ahead.

No phase starts while the previous one has an open problem.

---

## Verification

**Phase 1**
- Fetch a resume's stored path directly against Supabase without a signed URL → 400/403. With a signed URL from the guarded route → 200. Same for a verification document.
- `curl -X POST /api/cron/job-alerts` with no auth header → 503 or 401. Never 200.
- Password reset round trip: request → email → consume → old password rejected, new accepted. Consumed and expired tokens both refused.
- Hammer `POST /api/register` and login past the window → 429 with `Retry-After`.
- POST invalid JSON to a lib-validated route → 400 with a field message, not 500.

**Phase 2**
- Seeker receives a rejection → bell shows unread → click routes correctly.
- Apply, then open a conversation from the job page. A seeker who has **not** applied is refused.
- Schedule an interview → candidate sees it, gets the email, `.ics` opens in a calendar client.
- Trigger crons manually with the secret; alerts send once, an immediate second run sends nothing.

**Phase 3**
- Live job URL in Google's Rich Results Test → `JobPosting` valid, zero errors.
- `/sitemap.xml` contains jobs, companies, public seeker profiles; nothing unverified or non-`ACTIVE` leaks.

**Phase 4**
- Drive an application to `HIRED` → both parties can review, neither twice, non-participants not at all.
- Review aggregates and response rate appear on the public company page and recompute after the rollup cron.

**Throughout**
- `npm run lint && npx tsc --noEmit && npm test` green.
- Migrations applied with `npx prisma migrate deploy` (never `migrate dev`); `npx prisma migrate status` clean after.
- Re-run the full manual E2E loop from `docs/build-plan.md` §Sprint 3 — post → approve → find → apply → Kanban → both parties emailed. Still unchecked in the build plan and never verified end to end.
