-- Admin console Phase 5 (docs/build-plan.md "Sprint 11 — approved (admin
-- console Phase 5, 2026-09-15)", spec: docs/ADMIN-CONSOLE-PLAN.md §4.10,
-- §8.2). Four changes, three new tables (impersonation_sessions,
-- feature_flags, cron_runs) and one new nullable column + index on
-- admin_audit_logs. RBAC (admin_profiles) already landed in Sprint 10 and
-- needs nothing further here.
--
-- This migration is purely additive: it creates new tables, columns, and
-- indexes only. It does not alter or drop any existing table, column,
-- index, or constraint.

-- CreateTable
-- §8.2's consent-and-ticket record for an admin "log in as this user"
-- session, and the authority for expiry and revocation. Auth.ts uses
-- session: { strategy: "jwt" } and there is no Session model in this
-- schema, so the 1-hour impersonation token rides in its own cookie rather
-- than a DB-backed session row — a bare stateless JWT cannot be revoked
-- before its TTL, which §8.2 requires. Every read of the impersonation
-- cookie must also check ended_at/expires_at here before honoring it.
--
-- admin_user_id and target_user_id are plain TEXT columns with NO foreign
-- keys to users, same precedent as admin_audit_logs.admin_user_id and
-- abuse_reports.reporter_user_id: this is a historical record of who
-- impersonated whom and why, and it must survive either account being
-- deleted rather than cascade-deleting or leaving a dangling required
-- relation.
--
-- scope is a plain TEXT column, not a Postgres enum — same reasoning
-- already applied to queue reason codes (lib/admin/reason-codes.ts): the
-- set of scopes narrower than full impersonation is expected to grow, and
-- adding one should be a row/config change, not a migration.
CREATE TABLE "impersonation_sessions" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "ticket_reference" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'READ_ONLY',
    "reason" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "ended_reason" TEXT,
    "ip_hash" TEXT,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "impersonation_sessions_admin_user_id_started_at_idx" ON "impersonation_sessions"("admin_user_id", "started_at");

-- CreateIndex
CREATE INDEX "impersonation_sessions_target_user_id_started_at_idx" ON "impersonation_sessions"("target_user_id", "started_at");

-- CreateIndex
CREATE INDEX "impersonation_sessions_expires_at_idx" ON "impersonation_sessions"("expires_at");

-- AlterTable: admin_audit_logs — one new nullable column. Nullable because
-- existing rows predate impersonation and most audit rows are an admin
-- acting as themselves, not impersonating. Plain TEXT, no foreign key to
-- impersonation_sessions, for the same reason as admin_user_id on this
-- table: an audit row must outlive the session record's own
-- retention/deletion story. Per §8.2: "every action inside the session
-- audited to admin_audit_logs with the impersonation session id attached."
ALTER TABLE "admin_audit_logs" ADD COLUMN "impersonation_session_id" TEXT;

-- CreateIndex
CREATE INDEX "admin_audit_logs_impersonation_session_id_idx" ON "admin_audit_logs"("impersonation_session_id");

-- CreateTable
-- Feature flags for staged rollout, per docs/ADMIN-CONSOLE-PLAN.md §4.10.
-- key is a plain unique TEXT, never a Postgres enum, so adding a new flag
-- is a row insert — same reasoning as the open-vocabulary queue reason
-- codes in lib/admin/reason-codes.ts. rollout_percentage is nullable: a
-- flag can be a plain on/off switch (percentage unset) or a staged rollout
-- (percentage set), without needing two different tables.
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateTable
-- Cron run history for the admin health screen, per
-- docs/ADMIN-CONSOLE-PLAN.md §4.10 ("cron run history and last-success
-- age"). vercel.json declares no crons array, and all five scheduled jobs
-- are GitHub Actions workflows, so the app only learns a job ran if the
-- route itself writes a row here at start and finish. status is a plain
-- TEXT column (RUNNING / SUCCESS / FAILED in practice), not an enum —
-- consistent with every other operational status column in this schema
-- that is expected to gain values without a migration.
CREATE TABLE "cron_runs" (
    "id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "detail" JSONB,
    "error" TEXT,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cron_runs_job_name_started_at_idx" ON "cron_runs"("job_name" ASC, "started_at" DESC);
