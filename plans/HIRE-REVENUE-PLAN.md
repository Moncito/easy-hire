# Hire Revenue Plan — "Hire through EasyHire"

Status: **Phase 1 direction agreed (2026-10-03); schema in §3 awaits owner approval.** Phase 2 is blocked on PH business registration and a legal check.
Owner: Moncito. Backend: Manuel. Release flow: `plans/STAGING-AND-RELEASE.md`.

## 1. Why this shape

EasyHire earns from hires **without** charging a commission on the "Hired" button.

- A fee on the self-reported Hired status teaches employers to stop clicking it and pay the VA off-platform. Hire data rots and the fee disappears. OnlineJobs.ph competes on "no hiring fees".
- Instead, the platform owns a verifiable hire event: **the VA accepts an offer made on EasyHire.** Revenue (Phase 2) is an **optional paid guarantee** attached to that event: a replacement guarantee if the hire doesn't work out.
- **VAs are never charged.** Per-placement fees can make a platform look like a DOLE-licensed recruitment agency, so a legal check comes before any paid feature.
- EasyHire stays a merchant, not a money handler: no escrow, no holding the VA's pay.

| Phase | What | Money | Blocked on |
|---|---|---|---|
| **1** | Offers, VA acceptance, verified hires, demand test | none | nothing — build now |
| 2 | Paid hire guarantee (PayMongo first) | employer pays EasyHire | business registration, legal check |
| 3 | Payroll take-rate | via licensed partner only | partner, counsel |

## 2. Phase 1 scope

1. Employer sends an **offer** to an applicant (role, rate, hours, start date, message).
2. VA **accepts or declines** it. Accepting marks the application **HIRED** with `hire_source = OFFER_ACCEPTED`.
3. The existing "Hired" button keeps working (`EMPLOYER_MARKED`). The VA gets a "Confirm you were hired" prompt.
4. **One shared function marks an application hired**, used by every path. This fixes the bug below.
5. "Protect this hire" card shown at the hire moment, as a **waitlist** (no payment) to measure demand.
6. Admin sees a hires list with source and confirmation.

Out of scope: payments, contracts/e-signature, guarantee claims, payroll, changing the employer's ability to mark Hired.

### Bug fixed by step 4

`updateCollaborativePipeline` in `lib/collaborative-hiring-reviews.ts` moves an application to HIRED **without** setting `hiredAt` and without recomputing the VA's verification score. Hires made from the team-hiring workspace therefore:
- can't be reviewed (the review window anchors on `hiredAt`, `lib/reviews.ts`),
- are missing from admin hire counts (`lib/admin/rollups.ts`),
- would be invisible to any revenue built on hires.

The plain employer path (`updateApplication` in `lib/jobs/applications.ts`) does it correctly. Phase 1 moves that logic into one function both paths call.

## 3. Schema (needs owner approval before the migration is written)

Additive only, per `plans/STAGING-AND-RELEASE.md` → Migrations.

### New enums

```prisma
enum JobOfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  WITHDRAWN
  EXPIRED
}

enum HireSource {
  OFFER_ACCEPTED
  EMPLOYER_MARKED
}
```

### New table `job_offers`

```prisma
model JobOffer {
  id                 String         @id @default(cuid())
  applicationId      String         @map("application_id")
  companyId          String         @map("company_id")
  // Null when sent from the plain (single-owner) employer flow, which has no member id.
  createdByMemberId  String?        @map("created_by_member_id")
  createdByUserId    String         @map("created_by_user_id")
  title              String
  monthlyRateCents   Int?           @map("monthly_rate_cents")
  hourlyRateCents    Int?           @map("hourly_rate_cents")
  currency           String         @default("USD")
  hoursPerWeek       Int?           @map("hours_per_week")
  startDate          DateTime?      @map("start_date") @db.Date
  message            String?
  status             JobOfferStatus @default(PENDING)
  expiresAt          DateTime       @map("expires_at")
  respondedAt        DateTime?      @map("responded_at")
  declineReason      String?        @map("decline_reason")
  createdAt          DateTime       @default(now()) @map("created_at")
  updatedAt          DateTime       @updatedAt @map("updated_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  company     Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([applicationId, status])
  @@index([companyId, status])
  @@map("job_offers")
}
```

Raw SQL in the migration (Prisma can't express it), same precedent as the interview slot index:

```sql
-- At most one live offer per application.
CREATE UNIQUE INDEX "job_offers_one_pending_per_application"
  ON "job_offers"("application_id") WHERE "status" = 'PENDING';

-- Exactly one way to express pay.
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_one_rate_check"
  CHECK (("monthly_rate_cents" IS NULL) <> ("hourly_rate_cents" IS NULL));
```

### New columns on `applications`

```prisma
hireSource              HireSource? @map("hire_source")
hireConfirmedBySeekerAt DateTime?   @map("hire_confirmed_by_seeker_at")
```

Null for applications that were never hired. **No backfill** of old hires: their source is genuinely unknown, so they stay null rather than being guessed as `EMPLOYER_MARKED`.

### Waitlist (step 5)

No new table. Record a `platform_events` row (`recordEvent`, `lib/admin/events.ts`) with `eventType: "HIRE_GUARANTEE_INTEREST"`, `entityType: "APPLICATION"`. Enough to count demand; a real table comes with Phase 2.

## 4. Backend contract (Manuel)

All business logic in `lib/`, routes thin (CLAUDE.md). Zod schemas in `lib/validations/offer.ts`, shared with the UI.

### `lib/hiring/mark-hired.ts`

```ts
export async function markApplicationHired(
  tx: Prisma.TransactionClient,
  args: {
    applicationId: string;
    fromStatus: ApplicationStatus;
    hireSource: HireSource;
    actorMemberId: string | null;
    seekerConfirmed: boolean; // true when the VA accepted an offer
  }
): Promise<{ becameHired: boolean }>;

/** Side effects that must run after the transaction commits. */
export function afterApplicationHired(args: {
  applicationId: string;
  seekerProfileId: string;
  jobId: string;
  actorType: "EMPLOYER" | "SEEKER";
  actorUserId?: string;
}): void;
```

- Inside the transaction: set `status = HIRED`; set `hiredAt` **only if null** (stamp-once rule, see the `Application.hiredAt` schema comment); set `hireSource` only if null; set `hireConfirmedBySeekerAt` when `seekerConfirmed`; write the STAGE_CHANGE activity via `stageChangeActivityData` (`lib/jobs/stage-history.ts`).
- After commit: `recomputeVerificationScore` (fire-and-forget), `recordEvent("CANDIDATE_HIRED")` **only when `becameHired`** (today the team path re-records it on every re-hire), cache invalidation (`invalidateEmployerWorkspace`, `invalidateSeekerApplications`).
- `updateApplication` and `updateCollaborativePipeline` both call these two when the target status is HIRED, with `hireSource: EMPLOYER_MARKED`. Their existing notification call stays where it is.

### `lib/hiring/offers.ts`

| Function | Who | Rules |
|---|---|---|
| `createOffer(userId, applicationId, input)` | employer | Plain flow: `requireEmployerApplication`. Team flow: membership with `applicants:manage`, or `applicants:assigned` on that job. Application must not be REJECTED or HIRED. Fails 409 if a PENDING offer exists (the partial unique index is the real guarantee). `expiresAt` = now + 7 days. |
| `withdrawOffer(userId, offerId)` | employer | Only PENDING. Sets WITHDRAWN. |
| `respondToOffer(userId, offerId, { accept, declineReason? })` | VA | Offer's application must belong to this seeker. Only PENDING and not past `expiresAt`. Accept: one transaction sets offer ACCEPTED + `markApplicationHired(..., hireSource: OFFER_ACCEPTED, seekerConfirmed: true)`. Decline: DECLINED + optional reason; application status unchanged. |
| `confirmHire(userId, applicationId)` | VA | Only HIRED applications with `hireConfirmedBySeekerAt` null. Stamps it. Does not change `hireSource`. |
| `listOffersForApplication`, `getPendingOffersForSeeker` | both | Reads. |

**Expiry is checked on read, no cron** (same pattern as company ownership transfer, `lib/company-ownership-transfer.ts`): any read or response that finds a PENDING offer past `expiresAt` treats it as EXPIRED and writes that status.

### Routes

| Method & path | Calls |
|---|---|
| `POST /api/applications/[id]/offers` | `createOffer` |
| `GET /api/applications/[id]/offers` | `listOffersForApplication` |
| `POST /api/offers/[offerId]/withdraw` | `withdrawOffer` |
| `POST /api/seeker/offers/[offerId]/respond` | `respondToOffer` (mirror `app/api/seeker/interviews/[interviewId]/respond`) |
| `POST /api/seeker/applications/[id]/confirm-hire` | `confirmHire` |
| `GET /api/seeker/offers` | `getPendingOffersForSeeker` |
| `POST /api/applications/[id]/guarantee-interest` | records the waitlist event |

Team-workspace equivalents live under `app/api/hiring/[companyId]/jobs/[jobId]/applications/[applicationId]/` beside the existing `pipeline` route.

### Notifications

Through the existing helpers in `lib/shared/email.ts`, respecting `notifyApplicationUpdates`:

| Event | Recipient | `notifications.type` | Email |
|---|---|---|---|
| Offer sent | VA | `OFFER_RECEIVED` | yes |
| Offer accepted | employer owner + job team | `OFFER_ACCEPTED` | yes |
| Offer declined | employer owner + job team | `OFFER_DECLINED` | in-app only |
| Offer withdrawn | VA | `OFFER_WITHDRAWN` | in-app only |

Add the four types to `notificationHref` (`lib/shared/notifications.ts`). Accepting an offer must **not** also send the generic "you got the job" email from `notifyApplicationStatusTransition`: the VA just accepted, so send one acceptance confirmation instead.

### Events (`recordEvent`)

`OFFER_SENT`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `OFFER_WITHDRAWN`, `OFFER_EXPIRED`, `HIRE_CONFIRMED_BY_SEEKER`, `HIRE_GUARANTEE_INTEREST`. These feed the Phase 2 decision (see §7).

## 5. UI (after the backend endpoints exist)

- **Employer:** "Make offer" in the candidate detail panel and the Pro decision queue; offer status chip on the candidate card; withdraw action.
- **VA:** offer card on the dashboard with Accept / Decline; "Confirm you were hired" prompt on HIRED applications without confirmation.
- **Hire moment:** "Protect this hire" card, waitlist only: "Replacement guarantee — coming soon. Want it?" → records interest.
- **Admin:** hires list (date, company, VA, `hireSource`, VA-confirmed yes/no, offer rate).
- Brand: Signal Teal for employer actions, Marigold for VA actions, Ember only for declines/expiry warnings. Rates and offer ids in IBM Plex Mono.

## 6. Tests (must pass before the PR)

- `markApplicationHired`: sets `hiredAt` once; never overwrites; both the plain and the team paths set it (regression test for the bug).
- Offer state machine: can't accept WITHDRAWN/DECLINED/EXPIRED; can't accept after `expiresAt`; second PENDING offer rejected.
- Permissions: VA can't create/withdraw; employer can't accept; a VA can't respond to another VA's offer; a HIRING_MANAGER without assignment can't send offers.
- Accepting sends the acceptance notification and not the generic hired email.
- On staging (`npm run dev:staging`, accounts from `scripts/seed-staging.mjs`): `employer.pro` offers `va.two` on the Social Media job → `va.two` accepts → application HIRED, `hireSource = OFFER_ACCEPTED`, `hiredAt` set, notifications on both sides, hire in the admin list.

## 7. Phase 2 preview (not approved, do not build)

- Legal check: a guarantee fee must not make EasyHire a placement agency.
- `PaymentProvider` interface in `lib/billing/providers/` (PayMongo first; one-off charge works with e-wallets).
- `transactions` ledger with kind `HIRE_GUARANTEE`; `hire_guarantees` table (window, status, claim).
- Eligibility: `hireSource = OFFER_ACCEPTED` and company `verifiedStatus = APPROVED`.
- Claim = free replacement (job re-opened and boosted, curated shortlist). No cash handling of VA pay.
- **Go/no-go signal from Phase 1:** share of hires that come through accepted offers, and guarantee-interest clicks per hire.

### Owner decisions still open (Phase 2 only)

- Guarantee window: 30 / 60 / 90 days; replacement only vs partial refund.
- Price: flat per hire vs % of the first-month rate from the offer.
- Does Employer Pro include one guarantee a month?

## 8. Order of work

1. Owner approves §3 schema.
2. Manuel: migration + `markApplicationHired` refactor (fixes the bug on its own; can ship first) → PR into `dev`.
3. Manuel: offers lib, routes, notifications, tests → PR into `dev`.
4. UI on top of the endpoints → PR into `dev`.
5. Owner tests on staging, applies the migration to production, then merges `dev` → `main`.
