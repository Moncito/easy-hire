# Fix slow navigation & re-querying across employer, hiring workspace, and seeker pages

## Summary

Every page switch in the app — the collaborative `/hiring/[companyId]` workspace, the solo `/employer` dashboard, `/seeker` pages, and the public `/jobs` / `/companies` browse pages — felt slow and re-queried the database on every navigation, even when going back to a page just visited a moment ago. This happened in production builds too, not just in local dev, so it wasn't a compile-time artifact.

This PR is six incremental phases, each independently shippable, that trace the problem to its root causes and fix them using the caching primitives Next.js already provides (`unstable_cache`, `revalidateTag`, the client Router Cache) — the same pattern the codebase already had partially in place for `lib/employer/cache.ts`, just extended to the rest of the app. No new state-management or data-fetching library was introduced (TanStack Query, Redux, SWR, Zustand were all considered and explicitly not needed — see "Why no TanStack Query / Redux" below).

Two unrelated but serious bugs were found and fixed along the way (see "Bugs found mid-flight").

## Root causes

1. **`next.config.ts` never set `experimental.staleTimes`.** Next.js 16 defaults `staleTimes.dynamic` to **0 seconds**. Every `/employer`, `/hiring`, `/seeker`, `/jobs*`, `/companies*` route is forced dynamic (they all call `auth()`, which reads cookies), so the client-side Router Cache held those pages for zero seconds — navigating away and back always triggered a fresh server round-trip, even to a page rendered a second ago.
2. **No server-side data cache in most of the app.** `lib/employer/cache.ts` already wrapped a few solo-employer-dashboard queries in `unstable_cache`, but the `/hiring` collaborative workspace, all of `/seeker`, and the public `/jobs`, `/jobs/[id]`, `/companies/[id]` routes hit Prisma directly, with zero caching, on every single request.
3. **A couple of client components forced full browser reloads** (`window.location.href`) instead of a client-side route change, throwing away all React state and doing a full document reload just to land on a different query string.
4. **Two client components in the hiring workspace shell re-fetched their own data on every mount**, even though the server had already fetched and passed down the same data as props — every navigation remounted the shell, which re-triggered these fetches for no reason.

## Phase-by-phase changes

### Phase 1 — Router Cache config
**File:** `next.config.ts`

Added:
```ts
experimental: {
  staleTimes: {
    dynamic: 30,
  },
},
```
This is the single highest-impact change in the whole PR. It tells Next.js's client-side Router Cache to hold a dynamically-rendered page segment for 30 seconds instead of 0, so navigating to a page you were just on reuses the already-rendered result instead of re-fetching from the server. Per Next's own docs this doesn't affect shared-layout re-execution logic, back/forward browser cache, or scroll restoration — it only governs whether a *revisited* segment is treated as fresh.

### Phase 2 — Cache the collaborative hiring workspace reads
**Files:**
- `lib/collaborative-hiring.ts` — `getActiveCompanyMembership` (the permission/membership check run via `requireCompanyMembership` on *every* navigation inside `/hiring/[companyId]/**`) and `getHiringWorkspacesForUser` (the workspace-switcher list, also used by `/seeker/layout.tsx`) are now wrapped in `unstable_cache`, 30s TTL, tagged per company+user / per user. The membership lookup keeps its original backfill-on-miss behavior (a pre-existing owner without a membership row yet) uncached, since that's a rare one-time write path.
- `lib/collaborative-hiring-team.ts` — `getCollaboratorWorkspaceOverview` (the queue page's job/application/interview counts) cached 15s. Invite-accept, role-change, and remove-member now call the new invalidation helpers immediately instead of waiting out the TTL.
- `lib/collaborative-company-profile.ts` — `getCollaborativeCompanyBranding` (topbar chip) and `getCollaborativeCompanyProfile` cached 30s, invalidated from both company-edit API routes.
- `lib/collaborative-job-management.ts` — job update/delete/submit-for-review now also bust the queue overview cache for that company.
- **New file** `lib/collaborative-hiring-cache-tags.ts` — tag-name helper functions (`companyMembershipTag`, `hiringWorkspacesTag`, `companyBrandingTag`, `companyQueueTag`), mirroring the existing `lib/employer/cache-tags.ts` convention exactly.

**Known limitation, called out explicitly rather than silently skipped:** application pipeline/scorecard/interview mutations (in `lib/collaborative-hiring-reviews.ts`) don't push an explicit invalidation into the queue-overview cache — that data relies on the 15s time-based expiry alone, so candidate counts there can lag up to 15 seconds behind a scorecard submission. Wiring that up would mean touching a much larger, separate mutation surface; flagged here as a candidate for a follow-up rather than expanding this PR's scope.

### Phase 3 — Cache the seeker page reads
**Files:**
- `lib/seeker/seekers.ts` — `ensureSeekerProfile`'s existence check and `getSeekerProfile` (the full profile page read, including recent applications) cached 30s. The profile-create/update write paths invalidate immediately.
- `lib/seeker/job-alerts.ts` — `listJobAlerts` cached 30s, invalidated on create/delete.
- `lib/seeker/saved-jobs.ts` — `listSavedJobIds` / `listSavedJobs` cached 30s, invalidated on save/unsave.
- `lib/seeker/dashboard.ts` — the whole dashboard aggregate (`getSeekerDashboardProfile` — profile + applications + saved jobs + conversations + job alerts in one call) cached 20s as a single unit, tagged across all four underlying data types so any one of them being mutated refreshes the dashboard.
- `lib/jobs/applications.ts` — `createApplication`, `withdrawApplication`, and `updateApplication` (the employer-side status-change path) now all invalidate the seeker's cached applications view too, on top of the pre-existing employer-side invalidation.
- **New files** `lib/seeker/cache-tags.ts` (tag helpers: `seekerProfileTag`, `seekerApplicationsTag`, `seekerSavedJobsTag`, `seekerJobAlertsTag`) and `lib/seeker/cache.ts` (a small cross-cutting `invalidateSeekerApplications` helper, kept separate because it's called from `lib/jobs/applications.ts`, a file outside the `lib/seeker/` tree).

### Phase 4 — Cache the public browse routes
**Files:**
- `lib/jobs/public-listing.ts` — `searchPublicJobs` (30s, cache key built from the normalized/sorted query-param set so every distinct filter combination gets its own entry), `listJobCategories` (5 min — rarely changes), `listLandingJobs` (30s, the homepage job feed), and `getPublicJob` (30s, tagged per job) are all now cached.
- `lib/shared/public-companies.ts` — `getPublicCompany` cached 30s.
- **New files** `lib/public-cache-tags.ts` (tag helpers: `publicJobsListTag`, `publicJobTag`, `publicCompanyTag`) and `lib/jobs/public-cache.ts` (the invalidation helpers, deliberately kept in their own file rather than inside `public-listing.ts` — `public-listing.ts` imports from `lib/jobs/featured.ts`, and `featured.ts` needed to call these invalidators, which would have created an import cycle between the two files if the invalidators lived in `public-listing.ts` itself).
- Invalidation wired into every existing job-mutation call site that already invalidated the solo-employer cache: `lib/jobs/crud.ts` (create/update/status-change/delete/submit-for-review), `lib/jobs/featured.ts` (feature/unfeature), and `lib/admin/jobs.ts` (admin approval). Also wired into both company-edit routes (`/api/company`, `/api/profile/employer`), since `getPublicCompany` embeds a company's active job list.
- The public route pages themselves (`app/jobs/page.tsx`, `app/jobs/[id]/page.tsx`, `app/companies/[id]/page.tsx`) needed **no restructuring** — they already called the public data-fetch functions before the `auth()` session read, so the expensive query was already decoupled from the session-dependent personalization bits; wrapping the fetch functions in `unstable_cache` was a drop-in change.

### Phase 5 — Stop the explicit cache-busters
**Files:**
- `components/employer/ApplicantsBoard.tsx` and `components/employer/MessageSeekerButton.tsx` — both had a `window.location.href = /employer/messages?c=...` hard browser reload after starting a conversation with an applicant. Replaced with `router.push(...)`. Verified `/employer/messages` reads the `c` conversation-id query param client-side inside `MessagesInbox` via `useSearchParams()`, so a soft client-side navigation updates it correctly with no full-page reload or flash.
- Reviewed all six remaining `router.refresh()` call sites (`CompanyProfileEditor.tsx` ×3 — banner upload, logo upload, profile save; `JobsBoard.tsx` ×1 — duplicate job; `VerificationDocumentsPanel.tsx` ×3 — doc upload, doc delete, request review) and deliberately **left them unchanged**. Each is a legitimate "I just mutated something on the page I'm looking at, refresh this page's server-rendered tree" call — the correct, minimal Next.js idiom for post-mutation freshness. The data they re-fetch is either already cache-backed by Phases 1–4 (so the refresh is now a cheap cache hit, not a fresh DB round-trip) or deliberately left uncached on purpose (`company.verifiedStatus`, which the verification panel depends on being always-current for the review workflow). Swapping these for manual `revalidateTag` calls would have added complexity for no observable benefit.

### Phase 6 — Trim redundant client mount-fetches in the hiring workspace shell
**Files:**
- `components/workspaces/WorkspaceTopbar.tsx` — removed the mount-time branding `useEffect` fetch entirely. The server already passes `initialBranding` as a prop, and that data is now cached + invalidated server-side (Phase 2), so the client-side "refresh it just in case" fetch was pure duplicate work on every remount. The component now just uses `initialBranding` directly.
- `app/api/hiring/notifications/route.ts` — **not** what the original plan draft assumed. `WorkspaceNotificationBell` (unlike the topbar) receives *no* server-seeded initial data — its mount-time fetch is the only way it gets its first render's data, so removing it would have regressed the bell to showing 0 unread notifications until the first 60-second poll tick. Instead of removing the fetch, the route it hits was pointed at the already-existing `getEmployerNotificationsCached` / `invalidateEmployerNotifications` helpers from `lib/employer/cache.ts` (the same cache already used by the solo `/employer` notification bell, same underlying notifications table) — so the still-necessary poll now reads from a 15-second cache instead of querying Postgres every single time, and "mark all read" invalidates that cache immediately so the count doesn't reappear on the next poll.

### Phase 7 — skipped
TanStack Query for the notification bell was considered and explicitly **not** implemented. Redux was also considered and rejected outright — there's no complex cross-cutting client state problem in this app that would justify it; the actual bug was a server-cache/Router-Cache gap, which neither library would have fixed on its own (TanStack Query can't cache data fetched inside a Server Component, which is how nearly every page in this app gets its data). Revisit only if more hand-rolled client-polling widgets get added later and the boilerplate becomes a genuine maintenance burden.

## Bugs found mid-flight

These weren't part of the original plan — they surfaced during implementation and testing, and were fixed as part of this same branch since they blocked verifying the caching work itself.

1. **Production login was completely broken.** `proxy.ts` (the edge middleware) builds its own `NextAuth(authConfig)` instance, and `auth.config.ts` never set `trustHost`. `Auth.ts`'s main instance *did* set `trustHost: true`, but the middleware's separate instance didn't inherit it. Dev mode (`next dev`) auto-trusts `localhost` so this never surfaced locally — but `next start` (production mode) enforces host-trust strictly, so the middleware couldn't read the session, treated every employer as logged out, and bounced them back to the landing page immediately after a successful login. **Fix:** moved `trustHost: true` into the shared edge-safe `auth.config.ts` so both the main auth instance and the middleware's instance pick it up from one source of truth. (`Auth.ts`, `auth.config.ts`)

2. **`unstable_cache` silently corrupts `Date` fields.** Next.js's `unstable_cache` round-trips its return value through JSON to store it, which turns every `Date` object into a plain ISO string. Any code downstream that still called `.toISOString()` on a field expecting a `Date` (e.g. `application.appliedAt.toISOString()` on the seeker dashboard, `profile.updatedAt.toISOString()` on the profile page) worked fine on the very first, uncached call, then threw `TypeError: X.toISOString is not a function` on every subsequent cache-hit request — surfacing to the user as a generic Next.js "Server error" page. **Fix:** added a shared `reviveDates()` helper (`lib/cache-utils.ts`) that walks a cached result and converts ISO-8601 date-strings back into real `Date` objects before returning it to the caller, so every downstream consumer keeps working exactly as it did before caching was introduced, with zero changes needed in the consuming pages/components. Applied to every cache wrapper added in Phases 2 and 3 that could carry a `Date` field (membership rows, the workspace list, the queue overview, the collaborative company profile, the seeker profile, and the seeker dashboard). Functions that already pre-serialized their own dates to strings before returning (e.g. `listJobAlerts`, `searchPublicJobs`) didn't need this — they were already following the safe pattern.

3. **A self-introduced gap in Phase 4, caught by lint before merge.** `lib/jobs/featured.ts` imported the new `invalidatePublicJob` / `invalidatePublicJobsList` helpers but never actually called them in `featureJob` / `unfeatureJob` — meaning featuring or unfeaturing a job (which changes its sort position in public search results) wouldn't have busted the public listing cache. Caught by ESLint's `no-unused-vars` warning during the pre-merge lint pass, confirmed as a real gap (not a false positive), and fixed before this PR was finalized.

## Also polished (not part of the caching work, done on request mid-PR)

- `components/jobs/JobDetailPanel.tsx` + `app/globals.css` — the `/jobs` split-pane view (job list on the left, detail preview on the right) used to snap/pop instantly to a new job's content when clicking a different row. Added a quick ~180ms fade-in on content swap (mirroring the pre-existing `employer-detail-panel-enter` pattern already in `globals.css`, rather than inventing a new animation approach), respects `prefers-reduced-motion`, no new dependency.

## Why no TanStack Query / Redux

Explicitly researched and decided against, rather than skipped by default:

- **Redux:** doesn't fit at all. There's no complex, cross-cutting client-side state problem anywhere in this app that would justify it — the existing lightweight React Context usage (e.g. `WorkspaceShellContext`) already covers the actual UI-state needs.
- **TanStack Query / SWR:** the reported bug was a server-cache and Router-Cache gap, not a missing client-side data-fetching library. Nearly every page in this app gets its data from a React Server Component doing a direct Prisma call — TanStack Query has no ability to cache that; it only helps for data a client component fetches itself via `fetch()`. The one place that pattern exists (the notification bell) is now cache-backed at the server layer instead (Phase 6), which fixes the actual cost (a DB round-trip on every poll) without adding a new dependency or a `QueryClientProvider` to the tree. If more hand-rolled client-polling widgets get added later and the boilerplate becomes painful, TanStack Query remains a reasonable narrow addition at that point — just not a fix for what was actually reported here.

## Verification performed

| Check | Result |
|---|---|
| `npm run build` (production build) | Clean, no errors — run after every phase |
| `npm run lint` | 30 errors / 34 warnings — confirmed **byte-for-byte identical to `main`** by checking out `main` and re-running lint directly for comparison. This branch introduces **zero** new lint errors or warnings. |
| `npm test` (vitest) | 45/45 tests passing across 3 test files, unchanged from before this branch |
| `npx prisma migrate status` | No schema changes anywhere in this branch; database already up to date; **no migration needed** |
| Manual smoke test, production build (`npm run build && npm run start`) | Repeated after every phase: employer login (incl. the trustHost fix), workspace switching, hiring queue/team/company-profile pages, seeker dashboard/profile/saved-jobs/job-alerts, public `/jobs` search + `/jobs/[id]` + `/companies/[id]` hit twice each (fresh request + cache-hit request) via curl and browser, job apply/withdraw, company logo/profile edits, team member role changes and removal — all confirmed working end-to-end between phases by the person driving this PR |

## Deploy notes

- No environment variable changes.
- No Prisma migration required — safe to deploy without a migration step.
- Every cache added in this PR has a short TTL (15–30 seconds; 5 minutes for the rarely-changing job category list) with explicit invalidation wired into the relevant write paths, so even in the worst case (a missed invalidation somewhere) a stale read self-heals within seconds rather than staying wrong indefinitely.
- No new npm dependencies were added.
