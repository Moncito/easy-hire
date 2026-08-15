# EasyHire Employer Pro Dashboard — Build Guide & Notes

**Status:** Planning complete — ready to build by phase  
**Visual system:** Neomorphism for **Employer Pro only** (Free keeps Harbor teal)  
**Navigation:** Collapsible sidebar + topbar (desktop); bottom tabs + More sheet (mobile)  
**Trust rule:** Pro never skips **company verification**. Pro skips **job admin review** only when company is `APPROVED`.

Use this doc to track progress. Fill **Notes** under each phase as you go.

---

## Locked decisions

| Decision | Choice |
|----------|--------|
| Who gets neo UI | **A — Pro only** |
| Easy AI scope | Full recommended suite (Wave 1 → 3) |
| Nav pattern | Enhanced **sidebar** (not navbar-only) |
| Cache | Keep Next.js tag cache + add **Upstash Redis** (L3) |
| AI hard rule | Never auto-reject candidates; human confirm always |

### Working notes

```
Date:
Decision changes:
Open questions:
```

---

## Current baseline (as of plan)

| Area | Today |
|------|--------|
| Routes | Dashboard, Jobs (+ new/edit/applicants), Applicants, Messages, Talent, Company, Reports, Billing |
| Nav | Sidebar + Topbar; mobile bottom tabs (**Billing missing** from mobile) |
| Pro shipped | Instant publish when Pro + verified company |
| Pro marketed / missing | Featured listings, advanced analytics exclusivity, CSV exports, AI |
| Cache | `unstable_cache` + tags in `lib/employer/cache.ts` — no Redis |
| AI | Marketing “coming soon” only |

### Baseline notes

```
Gaps spotted during build:
```

---

## Design system — Neomorphism Premium (Pro)

### Color tokens (`[data-employer-plan="pro"]`)

| Token | Hex | Use |
|-------|-----|-----|
| `--neo-bg` | `#EDF1F4` | Workspace canvas |
| `--neo-surface` | `#EDF1F4` | Extruded panels (shape from shadows) |
| `--neo-ink` | `#1A2332` | Primary text |
| `--neo-muted` | `#5B6B7C` | Secondary copy |
| `--neo-navy` | `#0D2750` | Dark shadow + structural accents |
| `--neo-teal` | `#1F8073` | Employer accent / CTAs |
| `--neo-gold` | `#C9A227` | Pro prestige (badges, Easy AI) — not Marigold |
| `--neo-ember` | `#D9553A` | Errors / rejections only |

### Shadow recipes

- **Raised:** `-20px -20px 28px #FFFFFF`, `20px 20px 28px rgba(13,39,80,0.18)`
- **Pressed:** same pair as inner shadows
- **Convex-in-concave:** mix for primary CTAs, Easy AI orb, hiring gauge

### Typography (Pro — load only when `plan === PRO`)

| Role | Face | Use |
|------|------|-----|
| Display | **Syne** | EasyHire Pro wordmark + page H1 |
| Body | **Source Sans 3** | Body copy |
| Data | **IBM Plex Mono** (keep) | Salaries, IDs, chart ticks, AI scores |

### Motion (fast, intentional)

1. Page enter — soft opacity + 4px lift  
2. Press feedback — raised → inset (~120ms)  
3. Easy AI reveal — shimmer while streaming  

Respect `prefers-reduced-motion`. No parallax / particles / glow spam.

### Pro component kit (`components/employer/pro/`)

- [ ] `NeoSurface` (raised / inset / flat)
- [ ] `NeoButton`, `NeoIconButton`
- [ ] `NeoMetric`, `NeoGauge`
- [ ] `NeoInput` (inset fields)
- [ ] `ProBadge`, `EasyAiChip`
- [ ] Chart wrappers (inset wells)

### Design notes

```
Contrast / a11y checks:
Font loading impact on Free path:
Motion tweaks:
```

---

## Pro entitlements matrix

| Capability | Free | Pro | Status |
|------------|------|-----|--------|
| Post jobs / ATS / messaging / talent | Yes | Yes | Exists |
| Company verification required | Yes | Yes | Exists |
| Admin job review before go-live | Yes | No (if verified) | Exists (`canAutoPublishJob`) |
| Instant publish UX copy | — | Yes | Todo |
| Neo premium UI | No | Yes | Todo |
| Featured job listings | No | Yes | Todo |
| Advanced analytics + exports | Basic | Full + CSV | Todo |
| Priority support flag | No | Yes | Partial (copy only) |
| Easy AI (all waves) | No | Yes | Todo |
| Saved talent lists / bulk depth | Limited | Full | Todo |
| Active jobs soft-cap | e.g. 3 | Unlimited / high | Todo |

### Entitlements notes

```
Soft-cap number chosen:
Featured ranking rules:
Export PII / audit decisions:
```

---

## Easy AI roadmap

**Provider:** Vercel AI SDK + LLM via env (OpenAI or Anthropic)  
**Code home:** `/lib/ai/` · **Routes:** `/api/employer/ai/*` · **Gate:** Pro + Redis rate limit

### Wave 1 — highest ROI

| Feature | Where | Behavior | Done |
|---------|-------|----------|------|
| JD Writer / Improver | Jobs new/edit | Draft/rewrite title, description, requirements | [ ] |
| Match Rank + Explain | Applicants + Talent | Score 0–100 + 3 reasons; sort assist only | [ ] |
| Interview Kit | Candidate detail | 8–12 questions from JD + resume | [ ] |
| Outreach Drafts | Messages | First / follow-up / rejection drafts | [ ] |
| Funnel Narrative | Reports / Dashboard | NL hiring-health summary | [ ] |

### Wave 2

| Feature | Done |
|---------|------|
| Screening question generator (job form) | [ ] |
| Company brand / About rewrite | [ ] |
| Bulk shortlist assist (“top 10”) with confirm | [ ] |
| Resume highlight extractor (talent profile) | [ ] |

### Wave 3

| Feature | Done |
|---------|------|
| Weekly hiring digest email (Resend) | [ ] |
| Job performance tips (views vs applies) | [ ] |
| Duplicate / spam heuristics (flag only) | [ ] |

### Easy AI notes

```
LLM provider chosen:
Rate limits per company:
Prompt failures / fallbacks:
Usage metering decisions:
```

---

## Page-by-page checklist

### Dashboard — `/employer/dashboard`

- [ ] Pro hero: EasyHire Pro brand + company + Easy AI insight + one CTA
- [ ] Neo metric row, gauge, funnel well, attention strip, jobs, queue
- [ ] Sparse onboarding path unchanged for incomplete companies
- [ ] Wire unused `pro` container prop

**Notes:**

```
```

### Jobs — `/employer/jobs`, new, edit

- [ ] Neo job cards + inset status pills
- [ ] Instant Publish path + clear copy (verified Pro)
- [ ] Featured toggle (Pro)
- [ ] Easy AI JD writer panel
- [ ] Free soft-cap banner

**Notes:**

```
```

### Applicants — hub + Kanban

- [ ] Neo columns (inset) + raised cards
- [ ] Easy AI rank sort + explain panel
- [ ] Bulk CSV export (Pro)
- [ ] Human-only status changes

**Notes:**

```
```

### Company Profile — `/employer/company-profile`

- [ ] Neo form sections
- [ ] Verification trust rail (unlocks instant publish)
- [ ] Easy AI brand copy (Wave 2)

**Notes:**

```
```

### Messages — `/employer/messages`

- [ ] Neo thread list + inset composer
- [ ] Easy AI outreach drafts
- [ ] Unread badges (cached)

**Notes:**

```
```

### Talent — `/employer/talent`

- [ ] Neo filters (inset inputs)
- [ ] Rank-to-open-job + deeper save lists (Pro)
- [ ] AI highlight strip (Wave 2)

**Notes:**

```
```

### Reports — `/employer/reports`

- [ ] Free: sparse board
- [ ] Pro: date range, funnel, time-to-hire, view→apply, job compare
- [ ] Easy AI narrative
- [ ] CSV / PDF export
- [ ] Charts in inset wells; Plex Mono numbers

**Notes:**

```
```

### Billing — `/employer/billing`

- [ ] Matrix matches real entitlements (no false “coming soon”)
- [ ] Stripe Customer Portal
- [ ] Harden webhook signature verification
- [ ] Upgrade → welcome neo state

**Notes:**

```
```

### New Pro routes

| Route | Purpose | Done |
|-------|---------|------|
| `/employer/easy-ai` | Hub: recent runs, usage, shortcuts | [ ] |
| `/employer/talent/lists` | Saved talent collections | [ ] |
| `/employer/reports/export` | Export history (optional) | [ ] |

**Shell / mobile**

- [ ] Sidebar Pro neo rail (no macOS traffic lights)
- [ ] Topbar: Easy AI trigger + plan pill
- [ ] Mobile More sheet: **Billing** + **Easy AI**

**Notes:**

```
```

---

## Backend & caching

### Layers

| Layer | Tool | Use |
|-------|------|-----|
| L1 | React `cache()` + Prisma | Per-request dedupe |
| L2 | `unstable_cache` + tags | Page data (`lib/employer/cache.ts`) |
| L3 | **Upstash Redis** | AI rate limits, featured IDs, analytics rollups, short-TTL AI responses, badge counts |

### Schema / data (prefer extend before new tables)

- [ ] `Job.featuredUntil` (DateTime?)
- [ ] `Subscription` period end / portal fields if missing
- [ ] `AiUsageEvent` (companyId, feature, tokens, createdAt)
- [ ] `SavedTalentList` (+ items) if not covered by `saved_seekers`
- [ ] Optional `AnalyticsDailyRollup` for Reports speed

### Infra

- [ ] `lib/redis.ts` (Upstash)
- [ ] Invalidate: writes → `revalidateTag` + Redis `DEL`
- [ ] Analytics rollup cron / scheduled path
- [ ] Stripe `constructEvent` (replace stub)
- [ ] Thin `/app/api` routes; logic in `/lib`

### Backend notes

```
Redis env vars:
Rollup strategy:
Stripe portal test results:
```

---

## Delivery phases

### P0 — Foundations

**Goal:** Pro can be themed without breaking Free.

- [ ] Pro neo tokens in `app/globals.css`
- [ ] Syne + Source Sans 3 gated load
- [ ] `data-employer-plan="pro"` on shell
- [ ] Neo primitives scaffold
- [ ] Mobile Billing link
- [ ] Align `CLAUDE.md` + `plan-comparison.ts` with instant-publish rule

**Exit criteria:** Free UI unchanged; Pro shell shows neo tokens on one smoke page.

**Notes:**

```
Started:
Finished:
Blockers:
```

---

### P1 — Neo shell + entitlements + pages

**Goal:** Pro feels premium and paid features exist beyond chrome.

- [ ] Reskin Pro shell (sidebar / topbar / mobile)
- [ ] Reskin core pages (Dashboard → Billing)
- [ ] Featured jobs field + public ranking
- [ ] Free active-job soft-cap
- [ ] Candidate CSV export
- [ ] Reports Pro dense gate

**Exit criteria:** Pro vs Free clearly different; featured + export + soft-cap work.

**Notes:**

```
Started:
Finished:
Blockers:
```

---

### P2 — Easy AI Wave 1

**Goal:** Five AI assists live, Pro-gated, never auto-reject.

- [ ] `/lib/ai/*` + provider wiring
- [ ] APIs: job-copy, rank, interview, message-draft, insights
- [ ] Global Easy AI drawer + contextual panels
- [ ] `AiUsageEvent` logging
- [ ] Rate limit (Redis or in-memory fallback)

**Exit criteria:** Each Wave 1 feature usable end-to-end on Pro; Free gets upgrade CTA.

**Notes:**

```
Started:
Finished:
Blockers:
```

---

### P3 — Redis, analytics, Stripe, Easy AI hub

**Goal:** Fast responses + production billing hygiene.

- [ ] Upstash Redis L3
- [ ] Analytics rollups for Reports
- [ ] Stripe webhook harden + Customer Portal
- [ ] `/employer/easy-ai` hub page

**Exit criteria:** Reports load from rollup/cache; webhook verified; portal works.

**Notes:**

```
Started:
Finished:
Blockers:
```

---

### P4 — AI Wave 2–3 + polish

**Goal:** Depth + retention features.

- [ ] Easy AI Wave 2
- [ ] Easy AI Wave 3
- [ ] Talent lists
- [ ] Digest email
- [ ] a11y / motion / visual regression polish

**Exit criteria:** Wave 2–3 shipped or consciously deferred; a11y pass on neo greys.

**Notes:**

```
Started:
Finished:
Blockers:
```

---

## Master checklist

### Design

- [ ] Pro-only neo token set + shadows
- [ ] Pro fonts gated
- [ ] Neo primitive kit
- [ ] Sidebar / topbar / mobile Pro skin
- [ ] Motion + reduced-motion
- [ ] Pricing / marketing Pro continuity

### Product

- [ ] Instant publish UX
- [ ] Featured jobs
- [ ] Free soft-cap
- [ ] Advanced Reports exclusivity
- [ ] CSV export
- [ ] Priority support affordance
- [ ] Plan comparison + pricing copy updated

### Pages

- [ ] All core Pro page passes
- [ ] Easy AI hub
- [ ] Talent lists
- [ ] Mobile nav parity

### Easy AI

- [ ] Provider + gates
- [ ] Wave 1
- [ ] Wave 2–3
- [ ] Usage + rate limits
- [ ] Never auto-reject enforced

### Backend

- [ ] Schema extensions
- [ ] Tag cache kept + Redis L3
- [ ] Analytics rollups
- [ ] Stripe webhook + portal

### Quality

- [ ] Neo contrast a11y
- [ ] Free path not slowed by Pro fonts/animations
- [ ] Pro / Free shell smoke tests

---

## Key files (when building)

| Area | Paths |
|------|--------|
| Tokens | `app/globals.css` |
| Shell | `components/employer/EmployerShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `EmployerMobileNav.tsx` |
| Billing | `lib/billing/subscriptions.ts`, `lib/billing/plan-comparison.ts` |
| Cache | `lib/employer/cache.ts`, new `lib/redis.ts`, `lib/ai/*` |
| Schema | `prisma/schema.prisma` |
| Pages | `app/employer/**` |

**Subagent split:** `ui-ux-designer` → Pro UI components/pages · `backend-engineer` → schema, entitlements, Redis, AI APIs · do not cross-edit.

---

## Parking lot / ideas

```
Ideas not in scope yet:
Nice-to-haves:
Deferred forever?:
```

---

## Session log

| Date | Phase | What landed | What broke | Next |
|------|-------|-------------|------------|------|
| | | | | |

```
Additional freeform notes:
```
