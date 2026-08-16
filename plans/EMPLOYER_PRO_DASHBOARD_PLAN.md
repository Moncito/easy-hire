# EasyHire Employer Pro — Implementation Guide

**Last reconciled:** 2026-08-17  
**Direction:** Clean SaaS workspace — Pro top navbar, standard grid, premium through workflows  
**Status key:** ✅ Shipped · 🔧 In progress / partial · ☐ Not started

---

## 1. Product Thesis

Employer Pro earns its price through **decision-first workflows, not decoration**.
Premium is perceived via faster hiring actions, richer analytics, contextual AI assists,
and saved-talent depth — not visual gimmicks. Every Pro UI surface must answer
"what should I do next?" before the employer has to ask.

**Non-negotiable business rules:**
- Pro never skips **company verification**. Pro skips **admin job review** only when the company's `verifiedStatus === "APPROVED"`. This is enforced in `lib/billing/subscriptions.ts` → `canAutoPublishJob`.
- Easy AI is **human-confirm always** — no auto-reject, no auto-publish, no auto-send. Every AI output is a draft the employer must act on.

---

## 2. Design Tokens (authoritative)

### Grid & Spacing

| Token | Value | Use |
|-------|-------|-----|
| Content max-width | **1296px** (`max-w-[1296px]`) | All employer pages — single unified value |
| Page gutter mobile | `px-6` (24px) | `EmployerPageContainer` |
| Page gutter desktop | `px-8` (32px) | `EmployerPageContainer` lg+ |
| Page top padding | `py-8` (32px) desktop | Canvas top |
| Related section gap | `space-y-8` (32px) | Within a page section |
| Major section gap | `space-y-12` (48px) | Between top-level page sections |
| Card inner padding compact | `p-5` (20px) | KPI row, metric strip, tight surfaces |
| Card inner padding standard | `p-6` (24px) | Charts, job cards, candidate detail |
| Card inner padding generous | `p-8` (32px) | Job form, company profile sections |

**Current issue:** `EmployerPageContainer` uses `max-w-[1480px]` for dashboard/reports and `max-w-7xl` (1280px) for other pages. All pages must migrate to `max-w-[1296px]`. Track in Phase 1.

### Typography

| Role | Font | Size / Weight | Class |
|------|------|--------------|-------|
| Page headline (Pro) | Space Grotesk | 36px–48px / 700 | `font-display text-4xl sm:text-[3rem]` |
| Page headline (Free) | Space Grotesk | 28px–32px / 700 | `font-display text-3xl` |
| Section heading | Space Grotesk | 20px / 700 | `font-display text-xl font-bold` |
| Card heading | Space Grotesk | 16px / 700 | `font-display text-base font-bold` |
| Body | Inter | 14px / 400 | `font-body text-sm` |
| Body large (Pro descriptions) | Inter | 16px–18px / 400 | `text-base sm:text-lg` |
| **Metric label** | Inter | **12px** / 600 uppercase | `text-xs font-bold uppercase tracking-wider` |
| Metric value | IBM Plex Mono | 36px (KPI) / 24px (card) / 20px (strip) | `font-data text-4xl font-bold` |
| Data inline | IBM Plex Mono | 14px | `font-data text-sm` |

**Current issue:** `text-[10px]` metric labels appear in 8+ components. Must be raised to `text-xs` (12px) globally. This is the single largest accessible typography fix remaining.

### Colors

| Color | Hex | Approved uses |
|-------|-----|--------------|
| Signal Teal | `#1F8073` | Primary CTAs, active nav, verified badge, AI accents, positive trends |
| Harbor Navy | `#1E3A5F` | Applications bar, structural headings, PENDING dot, nav structure |
| Ember | `#D9553A` | **Genuine warnings / rejection only** — REJECTED status, `actionRequired` insight, overdue review (>5 days) |
| Mist White | `#F5F6F4` | Page canvas bg |
| Deep Ink | `#20242B` | All primary text |
| Marigold | `#F2A93B` | Seeker-side only — **do not use in employer surfaces** |

**Log Out must use `text-ink/65`** — fixed 2026-08-17. Ember is for warnings only.
**"Needs review" KPI accent** must be `navy` by default; `ember` only when oldest unreviewed application is >5 days old (requires data-layer prop addition).

### Border Radius

| Surface | Radius |
|---------|--------|
| Pro card (`.pro-card`) | `rounded-[1.25rem]` (20px) |
| Nested inner card | `rounded-xl` (12px) |
| Input, dropdown menu | `rounded-xl` (12px) |
| Badge, pill, status | `rounded-full` |
| Tooltip / popover | `rounded-lg` (8px) |

### Shadows

```css
--pro-shadow: 0 1px 3px rgb(30 58 95 / 0.04), 0 12px 32px -16px rgb(30 58 95 / 0.1);
--pro-shadow-hover: 0 1px 3px rgb(30 58 95 / 0.06), 0 16px 40px -12px rgb(30 58 95 / 0.16);
--pro-shadow-focus: 0 0 0 3px rgba(31, 128, 115, 0.25);
```

These are navy-tinted flat shadows — not neomorphic extrusions. No `box-shadow` with `#FFFFFF` highlights.

---

## 3. Navigation

### Pro Shell (implemented ✅)

- **Top navbar** (`components/employer/pro-shell/EmployerProNavbar.tsx`) — pill nav centered, logo left, search + AI chip + avatar right.
- **Mobile** (`components/employer/EmployerMobileNav.tsx`) — fixed bottom tabs: Home · Jobs · Applicants · Messages · More.
- More sheet includes: Talent, Reports, Company Profile, Billing, Easy AI (Pro only).
- Free uses sidebar (`Sidebar.tsx` + `Topbar.tsx`). Sidebar is **not** coming to Pro.

### Remaining Nav Issues

| Issue | Status |
|-------|--------|
| `aria-current="page"` on active pill links | ✅ Fixed 2026-08-17 |
| Logo mark divs need `aria-hidden="true"` | ☐ Phase 1 |
| Easy AI mobile active state | ✅ Fixed 2026-08-17 |
| Log out color (ember → ink/65) | ✅ Fixed 2026-08-17 |

---

## 4. Component Inventory & Migration

### Shared atoms to extract (Phase 1–2)

| Atom | Problem | Target file |
|------|---------|------------|
| `<MetricLabel>` | `text-[10px]` duplicated 8+ times | `components/employer/ui/MetricLabel.tsx` |
| `<StatusDot>` | Inline in Topbar, BillingStatusStrip, KanbanColumn | `components/employer/ui/StatusDot.tsx` |
| `<MetricCard>` | `DashboardMetricCard` + `NeoMetric` use different trend arrow styles | Merge with `variant` prop |
| `<InlineStatRow>` | Pro page header stats re-created as ad-hoc JSX per page | `components/employer/ui/InlineStatRow.tsx` |
| `<ProUsageBar>` | Easy AI usage panel has no quota progress | `components/employer/pro/ProUsageBar.tsx` |

### Parallel Free / Pro components (intentional divergence — document only)

| Free | Pro | Notes |
|------|-----|-------|
| `EmployerPageHeader` (text-2xl/3xl) | `ProPageHeader` (text-3xl/4xl) | Size divergence intentional; keep both |
| `AttentionStrip` (pill cards) | `ProAttentionLinks` (inline text) | Visual treatment intentional |
| `DashboardHero` | `ProCompanyBand` | Fundamentally different layout |
| `JobsPageHeader` | `ProJobsPageHeader` | Acceptable |

### Pro-only components (implemented ✅ unless noted)

- `EmployerProNavbar` ✅ · `ProBadge` ✅ · `EasyAiChip` ✅ · `ProDashboardBoard` ✅
- `ProCompanyBand` ✅ · `ProKpiRow` ✅ · `ProApplicantList` ✅ · `ProActiveJobsSection` ✅
- `ProJobsPageHeader` ✅ · `ProApplicantsPageHeader` ✅ · `ProAttentionLinks` ✅
- `ProPageHeader` ✅ · `ProReportsBoard` ✅ · `EasyAiUsagePanel` ✅
- `EasyAiJobCopyPanel` ✅ · `EasyAiScreeningPanel` ✅ · `ReportsAiInsightsPanel` ✅
- `EasyAiBulkShortlistButton` ✅ · `TalentResumeHighlights` ✅ · `TalentApplicationHistory` ✅
- `NeoButton` ✅ (used sparingly; renders as flat card under `[data-employer-plan="pro"]`)
- `NeoSurface` ✅ (same — neo-* overridden to flat-card in Pro CSS scope)
- `ProUsageBar` ☐ Phase 2

---

## 5. Dashboard vs Reports — Information Architecture

### Dashboard (`/employer/dashboard`)

**Purpose:** Real-time hiring health + one clear next action per session.

| Section | Current | Target |
|---------|---------|--------|
| Company band (hero) | ✅ ProCompanyBand | Clamp company name to 2 lines |
| KPI row (4 cards) | ✅ ProKpiRow | Fix Ember accent rule (see §2) |
| Weekly trend chart | ✅ WeeklyTrendChart | Accessible table added ✅ 2026-08-17 |
| Applicant queue | ✅ ProApplicantList | — |
| Active jobs section | ✅ ProActiveJobsSection | — |
| Easy AI insight box | ✅ EasyAiInsightBox | — |
| Quick links strip | ✅ conditional | Always show for Pro (collapsed toolbar) |

**Exclusively Dashboard:** live queue, attention items, active job cards with current counts.

### Reports (`/employer/reports`)

**Purpose:** Historical pattern recognition, not real-time status.

| Section | Current | Target |
|---------|---------|--------|
| KPI row (4 cards) | ✅ ProKpiRow | Same 4 as dashboard — **add at least 2 exclusive metrics** |
| Weekly trend chart | ✅ WeeklyTrendChart | — |
| Hiring funnel | ✅ HiringFunnel | — |
| AI narrative | ✅ ReportsAiInsightsPanel | — |
| Job performance table | ✅ DashboardJobPerformance | — |
| "Back" link icon | ✅ ArrowLeft fixed 2026-08-17 | — |

**Exclusively Reports (to build):** best-performing job by apply rate · days-to-hire average · 30-day rolling trend (requires analytics rollup) · candidate source breakdown (source-dependent, defer to analytics rollup phase).

**Feasible now (Phase 3):**
- Best-performing job card: derive from `activeJobs` array, sort by `applicantCount / viewCount`
- Days-to-hire: derive from `hired` applications' `appliedAt` → `updatedAt` delta

**Requires rollup (Phase 4):**
- 30-day trend, source breakdown — needs `AnalyticsDailyRollup` table or Redis cache

---

## 6. Page-by-Page Target States

### `/employer/dashboard` ✅ Mostly shipped
- ☐ Unified max-width (Phase 1)
- ☐ Company name `line-clamp-2` (Phase 1)
- ☐ Greeting emoji `aria-hidden` (Phase 1)
- ☐ Quick links always-visible toolbar for Pro (Phase 2)
- ☐ Ember KPI accent only when >5 days stale (Phase 2, needs data prop)

### `/employer/jobs` ✅ Core shipped
- ☐ Unified max-width (Phase 1)
- ☐ Job form action bar: conditional copy for Pro verified ("Your job will go live immediately") (Phase 1)
- ☐ Featured jobs toggle — needs `Job.featuredUntil` schema addition (backend Phase 3)
- ☐ Free active-job soft-cap: `JobSoftCapBanner` exists — verify gate logic (Phase 1 check)

### `/employer/applicants` ✅ Core shipped (Kanban)
- ☐ Unified max-width — kanban is `full` width, correct; hub page needs fix (Phase 1)
- ☐ Kanban empty-state icon contrast: `text-ink/15` → `text-ink/30` (Phase 1)
- ☐ Pipeline stage labels `text-xs` ✅ Fixed 2026-08-17
- ☐ "Move" dropdown: add `role="menu"`, keyboard trap (Escape + Tab) (Phase 2)
- ☐ Kanban list-view toggle for <lg viewports (Phase 3)
- ☐ Bulk CSV export (Phase 3, needs backend route)

### `/employer/talent` 🔧 Basic shipped
- ☐ Saved talent lists (`/employer/talent/lists` route exists, check completeness) (Phase 3)
- ☐ Easy AI rank-to-open-job scoring (Phase 3)

### `/employer/messages` ✅ Core shipped
- ☐ Easy AI outreach draft chip in compose area for Pro (Phase 2)
- ☐ Outreach Drafts Easy AI hub link ✅ Fixed to `/employer/messages` 2026-08-17

### `/employer/reports` 🔧 Partial
- ☐ Unified max-width (Phase 1)
- ☐ "Back to dashboard" ArrowLeft ✅ Fixed 2026-08-17
- ☐ "Needs review" sparkline ✅ Fixed (now `[]`) 2026-08-17
- ☐ Add 2 exclusive Report metrics: best-performing job + days-to-hire avg (Phase 3)
- ☐ CSV export (Phase 3)

### `/employer/billing` ✅ Core shipped
- ☐ "Current plan" Pro chip: solid `bg-teal text-white` (currently ghost) (Phase 1)
- ☐ Free column footer `text-ink/40` → `text-ink/55` (Phase 1)
- ☐ Stripe Customer Portal (stub → real, backend Phase 3)
- ☐ Post-upgrade welcome state (Phase 2)

### `/employer/company-profile` ✅ Core shipped
- ☐ Replace raw `<div>` header with `ProPageHeader` when Pro (Phase 1)
- ☐ Show `activeJobsCount` + `totalApplicantsCount` in header stats (Phase 1)

### `/employer/easy-ai` ✅ Shipped
- ☐ Add `ProUsageBar` progress bar with quota fill (Phase 2)
- ☐ Group label contrast `text-ink/45` → `text-ink/60` (Phase 1)

---

## 7. Loading / Empty / Error Requirements

| State | Requirement |
|-------|------------|
| Loading | Every async page has a `loading.tsx` with `EmployerSkeletonSurface` or `Bone` shimmer — verify all exist |
| Empty — no jobs | Show `EmployerEmptyState` with "Post your first job" CTA; never show broken chart |
| Empty — chart | `WeeklyTrendChart` empty state ✅ shows "No hiring activity" + "Post a job →" |
| Empty — kanban column | ✅ Inline with `<Inbox>` icon; fix contrast to `text-ink/30` (Phase 1) |
| Error | `app/employer/error.tsx` exists ✅ — verify it shows a human-readable message |
| Upgrade gate | `EasyAiUpgradeGate` pattern ✅ — use for any Pro feature behind a Free wall |

**Responsive requirements:**
- All pages readable at 390px (iPhone SE) — no horizontal overflow except intentional kanban scroll
- Kanban: horizontal scroll on all viewports; list-view toggle at <lg (Phase 3)
- Tab navigation: all interactive elements reachable by keyboard; focus ring uses `--pro-shadow-focus`

---

## 8. Phased Implementation Order

### Phase 0 — Correctness (done in session 2026-08-17) ✅

All 8 confirmed low-risk bugs fixed: ArrowLeft back link · Outreach Drafts href · sparkline data integrity · Mobile Easy AI active state · Log Out ink color · aria-current on nav · WeeklyTrendChart accessible table · pipeline label text-xs.

### Phase 1 — Foundation (next sprint)

**Goal:** Tokens, a11y baseline, and cross-page consistency locked. Zero feature additions.

- ☐ Unify all pages to `max-w-[1296px]` in `EmployerPageContainer`
- ☐ Raise all `text-[10px]` labels to `text-xs` across 8+ components
- ☐ Extract `<MetricLabel>` atom
- ☐ Extract `<StatusDot>` atom
- ☐ Company Profile page: use `ProPageHeader`; add stats slot
- ☐ Billing: solid Pro current-plan chip + footer contrast fix
- ☐ Easy AI group labels: `text-ink/45` → `text-ink/60`
- ☐ Kanban empty-state icon contrast
- ☐ Job form action bar: conditional publish copy for Pro verified
- ☐ Logo mark `aria-hidden="true"` in EmployerProNavbar
- ☐ Greeting emoji `aria-hidden="true"` in ProCompanyBand
- ☐ Verify all `loading.tsx` files are populated (not just `export default function Loading() {}`)

**Exit criteria:** Lints clean; no `text-[10px]` in employer components; all pages at 1296px; a11y sweep passes on Navigation, Dashboard, Billing, Company Profile.

### Phase 2 — Core Workflow Polish

**Goal:** Interaction quality and Pro contextual AI entry points.

- ☐ Easy AI outreach chip in Messages compose (Pro only)
- ☐ `ProUsageBar` in Easy AI hub
- ☐ `ProEmptyState` component (Pro-styled empty state using `pro-card`)
- ☐ "Move" dropdown keyboard trap (Escape closes, Tab contained)
- ☐ Quick links always-visible toolbar on Pro dashboard
- ☐ Post-upgrade billing welcome state
- ☐ Ember KPI accent only when unreviewed >5 days (needs analytics data prop)

**Exit criteria:** Messages compose has AI entry point; keyboard can fully operate candidate detail panel; Easy AI hub shows meaningful quota bar.

### Phase 3 — Analytics & Exports

**Goal:** Reports earns its own page; Pro can extract data.

- ☐ Best-performing job metric (derive from existing `activeJobs` data)
- ☐ Days-to-hire avg metric (derive from hired applications)
- ☐ Candidate CSV export (backend `/api/employer/export`)
- ☐ Kanban list-view toggle for <lg viewports
- ☐ Saved talent lists (`/employer/talent/lists`) completeness check + polish
- ☐ Stripe Customer Portal (backend: replace stub with `stripe.billingPortal.sessions.create`)
- ☐ Featured jobs — requires `Job.featuredUntil` schema addition (backend agent)

**Exit criteria:** Reports has ≥2 metrics not on dashboard; CSV export works end-to-end; Portal opens for Pro subscriptions.

### Phase 4 — Easy AI Depth (Wave 2–3)

**Goal:** Retention via AI features that compound over time.

- ☐ Easy AI Wave 2: company brand copy, bulk shortlist, resume highlights (Wire routes exist; confirm end-to-end)
- ☐ Easy AI Wave 3: weekly digest email (Resend), job performance tips, spam heuristics
- ☐ Analytics rollup (`AnalyticsDailyRollup`) for 30-day Reports chart
- ☐ Redis L3 (Upstash) for rate limits and analytics rollup cache

**Exit criteria:** Wave 2 usable in production; Wave 3 at least partially shipped; 30-day chart populated from rollup.

### Phase 5 — QA Hardening

- ☐ Full keyboard navigation audit across all employer routes
- ☐ Dark mode regression pass (dark-mode shim covers `bg-white/*` — any new `bg-white/65` etc. needs explicit coverage)
- ☐ Free path smoke test: Pro fonts/animations must not load or run
- ☐ Stripe webhook `constructEvent` signature verification (currently stub)
- ☐ `prefers-reduced-motion` coverage for all employer animations

---

## 9. Entitlements Matrix

| Capability | Free | Pro | Status |
|------------|------|-----|--------|
| Post jobs / ATS / messaging / talent | ✅ | ✅ | Shipped |
| Company verification required | ✅ | ✅ | Shipped |
| Admin review before go-live | ✅ | Skipped if verified | ✅ Shipped (`canAutoPublishJob`) |
| Instant publish UX copy | — | ✅ | ☐ Phase 1 (job form action bar) |
| Pro top navbar + Pro canvas | — | ✅ | ✅ Shipped |
| Easy AI hub + Wave 1 | — | ✅ | ✅ Shipped (hub + JD writer + rank + interview + outreach + insights) |
| Easy AI Wave 2 | — | ✅ | 🔧 Routes exist, polish needed |
| Easy AI Wave 3 | — | ✅ | ☐ Phase 4 |
| Advanced Reports | Basic | ✅ exclusive metrics | ☐ Phase 3 |
| CSV export | — | ✅ | ☐ Phase 3 |
| Featured job listings | — | ✅ | ☐ Phase 3 (schema needed) |
| Saved talent lists | Limited | ✅ | 🔧 Route exists, check depth |
| Active-job soft-cap for Free | 3 | Unlimited | 🔧 Banner exists, verify gate |
| Stripe Customer Portal | — | ✅ | ☐ Phase 3 (backend stub) |

---

## 10. Key Files

| Area | Paths |
|------|-------|
| Tokens + CSS | `app/globals.css` |
| Shell | `components/employer/EmployerShell.tsx` · `pro-shell/EmployerProNavbar.tsx` · `EmployerMobileNav.tsx` · `EmployerPageContainer.tsx` |
| Pro primitives | `components/employer/pro/` · `components/employer/pro-dashboard/` |
| Billing logic | `lib/billing/subscriptions.ts` · `lib/billing/plan-comparison.ts` |
| Analytics | `lib/employer/analytics.ts` · `lib/employer/cache.ts` · `lib/employer/dashboard-panels.ts` |
| AI routes | `app/api/employer/ai/*` · `lib/ai/` |
| Pages | `app/employer/**` |
| Schema | `prisma/schema.prisma` |

**Subagent split:** `ui-ux-designer` → components, pages, tokens, accessibility · `backend-engineer` → schema, API routes, lib business logic, Redis, Stripe. Do not cross-edit.

---

## 11. Session Log

| Date | Phase | Landed | Notes |
|------|-------|--------|-------|
| 2026-08-17 | Audit | Full UI/UX audit — 26 issues identified across all employer routes | See audit output in parent chat |
| 2026-08-17 | P0 | 8 accessibility/bug fixes: ArrowLeft · Outreach href · sparkline integrity · mobile active state · Log Out color · aria-current · chart a11y table · text-[9px]→text-xs | Zero lint errors |
