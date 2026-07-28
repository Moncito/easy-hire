# Pull Request: Seeker UX Redesign — Pill Nav, Modern Jobs, Profile Deepen

## Overview

QA-driven seeker rebrand. Removes admin-style sidebar. Unifies chrome with landing shrinking pill nav. Modernizes `/jobs` as flagship experience. Deepens profile with employer live preview. Turns dashboard into job-search command center. Adds sonner toasts and seeker-themed messaging.

**Branch:** `feat/seeker-ux-redesign`  
**Base:** `main`

**Suggested commit message:**

```bash
git commit -m "feat(seeker): pill nav, jobs redesign, profile deepen, dashboard HQ, toasts"
```

**Before testing — run migration:**

```bash
npx prisma migrate deploy
```

---

## Summary

| Area | What changed |
|------|----------------|
| **Nav** | Sidebar killed → shrinking glass pill nav (Marigold seeker accent) |
| **Jobs** | Chip filters, modern cards, hero detail page, apply modal + toasts |
| **Profile** | LinkedIn, portfolio, certs, photo, visibility toggle, employer preview panel |
| **Dashboard** | 10-point profile strength, application pipeline filters, saved jobs, messages |
| **Messages** | Seeker skin — Navy bubbles, Marigold unread dots |
| **Global** | `sonner` toasts on apply, save, upload, send fail |

Typography and color palette unchanged — Marigold/Navy deepened, no new hex values.

---

## Phase 1 — Pill nav shell

- **New:** `components/seeker/SeekerPillNav.tsx` — GSAP scroll shrink (0–160px), full → compact pill, Marigold active nav
- **Updated:** `app/seeker/layout.tsx` — full-bleed Mist canvas, fixed pill header, no `pl-64` sidebar
- **Updated:** `components/jobs/PublicJobsHeader.tsx` — session-aware:
  - **Guest:** landing-style pill (Browse jobs / Log in / Get started)
  - **Seeker:** same `SeekerPillNav` as `/seeker/*`
  - **Employer/Admin:** dashboard link, no seeker CTAs
- **Updated:** `app/jobs/layout.tsx`, `app/companies/[id]/page.tsx` — top padding for fixed nav

**Fixes:** Logged-in seeker on `/jobs` no longer sees Log in / Get started. Browse Jobs no longer loses nav when leaving seeker layout.

---

## Phase 2 — `/jobs` flagship redesign

- **Updated:** `components/jobs/JobSearchPanel.tsx` — horizontal sticky chip filters, verified-only toggle, mobile filter sheet
- **Updated:** `components/jobs/JobListingCard.tsx` — Navy hover lift, Applied chip, IBM Plex Mono salary
- **Updated:** `app/jobs/page.tsx` — hero atmosphere
- **Updated:** `app/jobs/[id]/page.tsx` — hero band, Navy section labels, Marigold apply rail
- **Updated:** `components/jobs/ApplyButton.tsx` — Marigold modal accent, success state, persistent Applied button, sonner toasts
- **New:** `app/api/applications/list/route.ts` — applied job IDs for listing badges
- **Updated:** `lib/seekers.ts` — `listSeekerAppliedJobIds()`

---

## Phase 3 — Profile deepen + employer preview

### Schema (`prisma/schema.prisma` + migration)

New `SeekerProfile` columns:

- `linkedin_url` (nullable)
- `portfolio_url` (nullable)
- `certifications` (String[], default `[]`)
- `photo_url` (nullable)

**Migration:** `prisma/migrations/20260728233500_add_seeker_profile_extra_fields/`

### Backend

- **Updated:** `lib/validations/seeker.ts` — Zod for new fields + `profileVisibility`
- **Updated:** `lib/talent.ts`, `lib/applications.ts`, `lib/employer-auth.ts` — serializers expose new fields to employers
- **New:** `app/api/upload/photo/route.ts` — photo upload (Supabase `photos` bucket, 2MB max)
- **Updated:** `lib/storage.ts` — `uploadSeekerPhoto()`

### UI

- **Updated:** `components/seeker/SeekerProfileEditor.tsx` — edit column: photo, links, certs, visibility, 10-point strength meter
- **New:** `components/seeker/SeekerEmployerPreview.tsx` — live employer view panel (talent search / applicant drawer density)
- **Updated:** `app/seeker/profile/page.tsx` — passes new fields

---

## Phase 4 — Dashboard command center

- **Updated:** `app/seeker/dashboard/page.tsx`
  - Profile strength card (10 checkpoints)
  - Application pipeline with status filters: ALL / APPLIED / SHORTLISTED / INTERVIEW / HIRED / REJECTED
  - Saved jobs strip (from `SavedJob` model)
  - Job alerts empty-state CTA (from `JobAlert` model)
  - Recent employer messages

**Bugfix:** `statusFilter` undefined when no `?status=` query param — caused runtime crash on `/seeker/dashboard`.

---

## Phase 5 — Messages + global toasts

- **Updated:** `components/messages/MessagesInbox.tsx` — seeker theme (Navy outgoing bubbles, Marigold unread, job link in header, Browse jobs empty CTA)
- **Updated:** `app/layout.tsx` — global `<Toaster />` from sonner
- **Updated:** `package.json` — `sonner` dependency

---

## New files

```
components/seeker/SeekerPillNav.tsx
components/seeker/SeekerEmployerPreview.tsx
app/api/applications/list/route.ts
app/api/upload/photo/route.ts
prisma/migrations/20260728233500_add_seeker_profile_extra_fields/
```

---

## Modified files (high level)

```
app/seeker/layout.tsx
app/seeker/dashboard/page.tsx
app/seeker/profile/page.tsx
app/jobs/page.tsx
app/jobs/[id]/page.tsx
app/jobs/layout.tsx
app/layout.tsx
app/companies/[id]/page.tsx
components/jobs/PublicJobsHeader.tsx
components/jobs/JobSearchPanel.tsx
components/jobs/JobListingCard.tsx
components/jobs/ApplyButton.tsx
components/seeker/SeekerProfileEditor.tsx
components/messages/MessagesInbox.tsx
lib/seekers.ts
lib/validations/seeker.ts
lib/talent.ts
lib/applications.ts
lib/employer-auth.ts
lib/storage.ts
prisma/schema.prisma
package.json
package-lock.json
```

---

## Brand contract

| Surface | Nav | Accent |
|---------|-----|--------|
| Seeker | Shrinking pill | Marigold |
| Employer | Sidebar + Topbar | Teal |
| Admin | Sidebar | Navy |
| Landing | Pill on Ink glass | Marketing |

- **Marigold:** seeker CTAs, apply success, nav active, profile strength
- **Teal:** verified badges, employer signals only
- **Ember:** rejected application status only
- **Navy:** structural chrome, outgoing seeker message bubbles

---

## Test plan

### Prerequisites

- [ ] `npx prisma migrate deploy`
- [ ] Create Supabase `photos` bucket if testing photo upload (parallel to `resumes`)

### Nav

- [ ] Seeker login → pill nav on dashboard, profile, messages, `/jobs` — no sidebar
- [ ] Scroll → pill shrinks to compact icon mode
- [ ] Guest on `/jobs` → guest pill with Log in / Get started
- [ ] Seeker on `/jobs` → seeker pill, no guest CTAs
- [ ] Employer on `/jobs` → employer dashboard link

### Jobs

- [ ] Chip filters work (category, employment, remote, verified only)
- [ ] Job cards show Verified badge, salary in mono font
- [ ] Apply → toast + Applied chip on card + Applied button on detail
- [ ] Already-applied toast when reopening modal

### Profile

- [ ] Upload photo and resume
- [ ] Add LinkedIn, portfolio, certifications
- [ ] Toggle talent search visibility
- [ ] Employer preview panel updates live
- [ ] Profile save → toast

### Dashboard

- [ ] Profile strength meter reflects 10 checkpoints
- [ ] Pipeline filters by status (no crash without `?status=`)
- [ ] Saved jobs section shows saved roles or empty state
- [ ] Recent messages link to threads

### Messages

- [ ] Seeker: Navy outgoing bubbles, Marigold unread dots
- [ ] Empty state → Browse jobs CTA
- [ ] Send fail → toast error

---

## Notes for reviewer

- `components/seeker/SeekerSidebar.tsx` still exists but unused — safe to delete in follow-up
- Saved jobs bookmark icon on job cards deferred (model exists; dashboard shows list)
- Job alerts UI is empty-state only (create flow deferred)
- Pre-existing lint errors in employer/signup/admin files — out of scope
- Include `prisma/gen/*` in commit if repo tracks generated client

---

## Git commands

```bash
git checkout -b feat/seeker-ux-redesign

git add app/ components/ lib/ package.json package-lock.json prisma/schema.prisma prisma/migrations/20260728233500_add_seeker_profile_extra_fields/

git commit -m "feat(seeker): pill nav, jobs redesign, profile deepen, dashboard HQ, toasts"

git push -u origin feat/seeker-ux-redesign
```
