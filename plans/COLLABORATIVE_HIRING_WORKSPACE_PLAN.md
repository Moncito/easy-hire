# Collaborative Hiring Workspace — Implementation Plan

**Status:** Proposed  
**Owner:** Employer product  
**Target tier:** Employer Pro (manual entitlement first; billing integration later)

---

## 1. Purpose

EasyHire already helps one employer post jobs, review applicants, move candidates through a pipeline, message them, and use hiring tools. This upgrade makes the hiring process collaborative: a company can involve recruiters and hiring managers, gather structured feedback, and make a decision with a complete internal record.

**Product promise:** _Bring your hiring team together. Collect feedback, compare candidates, and make confident decisions faster._

This is a Pro capability. It must not take away Free employers’ existing ability to post jobs, manage their applicants, write private notes, or message candidates.

---

## 2. Scope and non-goals

### In scope

- Employer company members, invitations, and role-based permissions.
- Per-job scorecard templates and per-candidate evaluations.
- An internal, immutable hiring activity timeline.
- Interview scheduling records and feedback reminders.
- A decision-ready shortlist comparison view.

### Not in the first release

- Stripe checkout, subscriptions, invoices, or billing portal work.
- Google/Microsoft calendar synchronization.
- Automated candidate rejection, message sending, or hiring decisions.
- Sharing evaluations with candidates.
- Cross-company collaboration.
- Native mobile app work.

---

## 3. Entitlement strategy before billing

Do not couple this work to Stripe.

Create a single server-side entitlement helper:

```ts
isCollaborativeHiringEnabled(companyId): Promise<boolean>
```

For the initial rollout it returns `true` only for companies explicitly enabled by an admin or a development allowlist. Once subscriptions are live, its implementation can change to:

```ts
return isEmployerPro(companyId);
```

All workspace pages and write APIs must use this helper. UI gates are useful guidance, but never sufficient protection.

### Temporary enablement model

Add a nullable/false-by-default `collaborativeHiringEnabled` field to `Company`, or create a small `CompanyFeatureFlag` model if future per-company feature flags are expected. Prefer the latter if more than one pilot-only capability is planned.

Admin can enable or disable the feature from the existing company review area. Disabling it must preserve the company’s data and only remove access.

---

## 4. Roles and permissions

The current company model has one account owner. Add company membership without changing existing employer ownership.

| Role | Company settings | Jobs | Applicants | Scorecards | Interviews | Team |
|---|---|---|---|---|---|---|
| `OWNER` | Full | Full | Full | Full | Full | Invite/remove/change roles |
| `RECRUITER` | Read | Create/edit | Full | Full | Full | Read members |
| `HIRING_MANAGER` | Read | Assigned/read | Review assigned jobs | Submit own | Participate | Read members |
| `VIEWER` | Read | Read | Read | Read-only | Read | Read members |

Important rules:

- The original `Company.userId` remains the initial `OWNER`.
- A company must always retain at least one owner.
- Members can access only their own company’s data.
- A hiring manager may only open jobs explicitly assigned to them.
- A member’s evaluation is editable only by that member until the candidate reaches a terminal decision; preserve a revision/audit entry whenever it changes.
- Never expose internal notes, scorecards, interviewer feedback, or team information to seekers.

---

## 5. Data model

Use Prisma migrations. Proposed model names are illustrative; confirm names against the existing schema conventions before implementation.

```text
Company
  └─ CompanyMember
       ├─ User (existing account)
       └─ role, status, invitedBy, joinedAt

Company
  └─ CompanyInvitation
       └─ email, role, tokenHash, expiresAt, invitedBy, acceptedAt

Job
  ├─ JobTeamMember          (assigned hiring managers/recruiters)
  ├─ ScorecardTemplate
  │    └─ ScorecardCriterion
  └─ Interview

Application
  ├─ CandidateEvaluation
  │    └─ EvaluationRating
  └─ HiringActivity
```

### Required entities

- `CompanyMember`: `companyId`, `userId`, `role`, `status`, timestamps; unique on `(companyId, userId)`.
- `CompanyInvitation`: invitee email, requested role, a hashed one-time token, expiration, inviter, accepted/revoked timestamps.
- `JobTeamMember`: assigns company members to a job; unique on `(jobId, memberId)`.
- `ScorecardTemplate`: one active template per job, with a title and optional instructions.
- `ScorecardCriterion`: label, description, sort order, and a fixed 1–5 rating scale for v1.
- `CandidateEvaluation`: one evaluation per `(applicationId, memberId)`; overall recommendation (`STRONG_NO`, `NO`, `YES`, `STRONG_YES`), summary, submitted timestamp.
- `EvaluationRating`: score for one criterion within one evaluation.
- `Interview`: application, scheduled time, duration, location/meeting URL, status, organizer, and attendees.
- `HiringActivity`: append-only internal event log with actor, entity type/id, event type, metadata JSON, timestamp.

### Data and privacy constraints

- Store invitation tokens only as hashes; send only the original token in the invitation URL.
- Do not place resume text, application answers, or other candidate PII in activity metadata.
- Index company, job, application, member, and time-based timeline queries.
- Use database uniqueness constraints for membership, job assignment, and one evaluation per member/application.

---

## 6. User flows

### A. Invite a team member

1. Owner opens **Company profile → Team**.
2. Owner enters an email and selects a role.
3. Server verifies the Pro/pilot entitlement and Owner permission.
4. An expiring invitation is created and an email is sent.
5. Invitee signs in or creates an account, then accepts the invitation.
6. The system creates a `CompanyMember` and writes a `MEMBER_JOINED` activity event.

### B. Set up a job’s hiring team and scorecard

1. Recruiter or Owner opens a job’s **Hiring setup** tab.
2. They assign relevant members.
3. They select a default scorecard or create criteria for that role.
4. The system records assignments/template changes in the activity timeline.

### C. Review an applicant

1. A permitted member opens the candidate detail panel.
2. They see application details, existing internal notes, interviews, and their own scorecard status.
3. They submit a score and recommendation for each criterion.
4. The candidate’s aggregate summary updates, but individual feedback remains attributable.
5. The system records `EVALUATION_SUBMITTED` or `EVALUATION_UPDATED`.

### D. Coordinate an interview

1. Recruiter or Owner schedules an internal interview record and chooses attendees.
2. Invited members see it in the candidate detail and their relevant workspace queue.
3. Feedback reminders are shown after the scheduled end time; email reminders are a later enhancement.
4. Interview outcome and associated scorecards inform the final decision.

### E. Make a decision

1. The decision-maker opens a shortlist comparison view for a job.
2. They compare selected candidates’ current stage, aggregate evaluation, criteria ratings, answers, notes, and upcoming/completed interviews.
3. They move a candidate forward, reject them, or mark them hired using the existing application pipeline.
4. The action writes a timeline event. Existing candidate-status notifications continue to follow their present rules.

---

## 7. Implementation phases

### Phase 0 — Design and safety foundations

- Define role permission constants in one server-side module.
- Add the manual collaborative-hiring entitlement and admin enable/disable control.
- Add feature-gate tests and cross-company authorization tests.
- Write the Prisma migration plan and a rollback/data-retention note.

**Exit criteria:** No collaborative endpoint can be reached by Free/non-enabled companies or by a member from another company.

### Phase 1 — Team membership and invitations

- Add `CompanyMember` and `CompanyInvitation` schema/migration.
- Backfill/create an `OWNER` membership for existing company owners.
- Build Team settings page: members, roles, pending invitations, revoke/remove actions.
- Build invitation acceptance flow and Resend email template.
- Update employer session/context helpers to resolve membership and permissions.
- Write activity events for member lifecycle actions.

**Exit criteria:** An Owner can invite, revoke, remove, and change roles safely; existing single-owner employers retain full access.

### Phase 2 — Job teams and scorecards

- Add job assignments, templates, criteria, evaluations, and ratings.
- Provide a small default scorecard: Skills, Relevant Experience, Communication, Role Fit, Recommendation.
- Add a **Hiring setup** surface per job to assign team members and configure criteria.
- Add a **Scorecard** tab to the existing candidate detail experience.
- Display individual submitted status and a transparent aggregate; do not hide disagreement.
- Add permission, validation, and aggregation tests.

**Exit criteria:** Assigned members can independently submit structured feedback; unauthorized members cannot read or write it.

### Phase 3 — Activity and interviews

- Add append-only activity event writing for membership, assignment, evaluation, interview, and status changes.
- Render a candidate timeline in the existing applicant detail panel.
- Add internal interview records, attendee selection, status, and feedback-due state.
- Add an employer dashboard attention item for overdue feedback.

**Exit criteria:** A decision-maker can understand who did what and what feedback remains without leaving the applicant context.

### Phase 4 — Decision workspace

- Add a job-level shortlist view with selectable candidates.
- Render comparable data with accessible responsive behavior; use a stacked layout on mobile.
- Include stage, scorecard aggregates, criterion summaries, application answers, notes count, and interview status.
- Reuse the existing application status APIs rather than creating a separate decision state machine.

**Exit criteria:** A hiring team can compare 2–5 shortlisted candidates and make a pipeline decision from one place.

### Phase 5 — Hardening and rollout

- Test role matrix, invitation expiry, revocation, last-owner protection, and company isolation.
- Test email failure/retry behavior without accidentally creating duplicate memberships.
- Accessibility audit: keyboard scorecard input, focus management in dialogs, labels, contrast, and screen-reader context.
- Add audit/export policy documentation for new internal hiring data.
- Enable for internal/pilot companies, gather feedback, then expand availability.

**Exit criteria:** The feature is safe for pilot customers and has a clear support/admin operating procedure.

---

## 8. API surface (proposed)

All endpoints authenticate first, resolve company membership, check the collaborative-hiring entitlement, and authorize the specific action.

| Area | Endpoint examples |
|---|---|
| Team | `GET/POST /api/employer/team`, `PATCH/DELETE /api/employer/team/[memberId]` |
| Invitations | `POST /api/employer/team/invitations`, `DELETE /api/employer/team/invitations/[id]`, `POST /api/invitations/[token]/accept` |
| Job setup | `GET/PATCH /api/employer/jobs/[id]/hiring-setup` |
| Evaluations | `GET/POST/PATCH /api/employer/applications/[id]/evaluations` |
| Interviews | `GET/POST /api/employer/applications/[id]/interviews`, `PATCH/DELETE /api/employer/interviews/[id]` |
| Timeline | `GET /api/employer/applications/[id]/activity` |
| Compare | `GET /api/employer/jobs/[id]/compare?applicationIds=…` |

Use Zod schemas for every request body and ensure every query scopes through the active company.

---

## 9. Success measures

- Percentage of enabled companies with at least two active members.
- Percentage of active jobs with a scorecard configured.
- Percentage of reviewed applications with at least two evaluations.
- Median time from application to first review/interview/decision.
- Number of overdue feedback items per active job.
- Upgrade conversion once billing is introduced.

---

## 10. Later billing integration

When Stripe is introduced, replace the temporary entitlement implementation only; keep all calling code unchanged.

```ts
export async function isCollaborativeHiringEnabled(companyId: string) {
  return isEmployerPro(companyId);
}
```

Existing pilot data, teams, scorecards, interviews, and activity records remain intact. If a company later downgrades, preserve its data and provide read-only access or an export path according to the eventual billing policy.

---

## 11. First implementation milestone

Build **Phase 0 and Phase 1** first:

> Manual entitlement, company members, invitations, roles, and permission checks.

It creates the safe platform for every later collaborative workflow. Do not begin scorecards until membership and company isolation are fully tested.
