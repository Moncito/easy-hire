-- Admin console Phase 0 (docs/build-plan.md "Sprint 10 — approved (admin
-- console Phase 0, 2026-09-09)", spec: docs/ADMIN-CONSOLE-PLAN.md §6.1, 6.2,
-- 6.4, 6.5, 6.6, 6.7). Seven new tables (platform_events + its daily rollup,
-- admin_audit_logs, vendor_costs, platform_daily_rollups, abuse_reports,
-- admin_profiles), five new nullable columns on ai_usage_events, and three
-- new nullable columns (+ index) each on seeker_profiles and companies.
--
-- This migration is purely additive: it creates new tables, columns,
-- indexes, a new enum type, and foreign keys only. It does not alter or drop
-- any existing table, column, index, or constraint.
--
-- Partitioning note: Prisma has no partitioning DSL, so the Prisma
-- `PlatformEvent` model only describes the row shape of platform_events.
-- Everything about HOW the table is physically partitioned — the
-- `PARTITION BY RANGE (created_at)` clause, the monthly partitions, and the
-- DEFAULT catch-all partition below — exists only in this SQL file and must
-- never be reverse-engineered from prisma/schema.prisma. This is the same
-- SQL-only precedent already used for `Job.searchVector` /
-- `SeekerProfile.searchVector` in this codebase: a real database feature
-- Prisma can't express, documented in the schema but authored here.
--
-- Retention: platform_events partitions stay hot for 90 days, then get
-- rolled up into platform_event_daily_rollups and detached (operational
-- task, not part of this migration). admin_audit_logs is retained
-- indefinitely and is intentionally NOT partitioned.

-- CreateEnum
CREATE TYPE "AdminLevel" AS ENUM ('SUPPORT', 'MODERATOR', 'FINANCE', 'SUPER_ADMIN');

-- CreateTable
-- Partitioned parent table. No standalone primary key constraint name is
-- given here for the same reason every other table in this repo lets
-- Postgres derive the default `<table>_pkey` name — kept consistent with
-- the rest of this migration.
--
-- user_id has NO foreign key to users on purpose: platform_events is an
-- append-only analytics/history table, not live state. A user deleting
-- their account must not cascade away their own event history (that
-- history is exactly what a fraud investigation after account deletion
-- would need to read), and lib/account/account-deletion.ts anonymizes
-- User/SeekerProfile/Company rows in place rather than hard-deleting the
-- id, so user_id here stays valid regardless of account deletion.
CREATE TABLE "platform_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");

-- CreateTable: monthly partitions, 2026-09 through 2026-12 inclusive.
CREATE TABLE "platform_events_2026_09" PARTITION OF "platform_events"
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE "platform_events_2026_10" PARTITION OF "platform_events"
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE "platform_events_2026_11" PARTITION OF "platform_events"
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE "platform_events_2026_12" PARTITION OF "platform_events"
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- CreateTable: DEFAULT partition. Safety net only, not the plan — catches
-- any write whose created_at falls outside the ranges above (e.g. a clock
-- skew, or simply nobody having created next month's partition yet) so an
-- insert into platform_events can never fail for want of a partition.
--
-- ⚠ MAINTENANCE HAZARD, read before adding partitions later.
-- A DEFAULT partition is not free. When a new partition is added to a table
-- that has one, Postgres must scan the DEFAULT partition to prove no
-- existing row belongs in the incoming range, and it takes an ACCESS
-- EXCLUSIVE lock on DEFAULT while doing so. If even one row in DEFAULT
-- falls inside the new range, CREATE TABLE ... PARTITION OF fails outright.
-- So the safety net actively blocks the monthly rollout precisely when it
-- has caught something.
--
-- The operational rule that follows: the nightly cron must create partitions
-- SEVERAL MONTHS AHEAD so DEFAULT stays permanently empty. DEFAULT is there
-- to stop a write failing at 00:00 on the 1st, not to hold data.
--
-- If DEFAULT ever does accumulate rows for a month that needs a partition:
--   BEGIN;
--   ALTER TABLE platform_events DETACH PARTITION platform_events_default;
--   CREATE TABLE platform_events_YYYY_MM PARTITION OF platform_events
--       FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01');
--   INSERT INTO platform_events
--       SELECT * FROM platform_events_default
--       WHERE created_at >= 'YYYY-MM-01' AND created_at < 'YYYY-MM+1-01';
--   DELETE FROM platform_events_default
--       WHERE created_at >= 'YYYY-MM-01' AND created_at < 'YYYY-MM+1-01';
--   ALTER TABLE platform_events ATTACH PARTITION platform_events_default DEFAULT;
--   COMMIT;
--
-- Partitions below cover 2026-09 through 2026-12 only. Everything from
-- 2027-01-01 lands in DEFAULT until the cron exists. The cron is part of
-- Phase 0 and must ship before then.
CREATE TABLE "platform_events_default" PARTITION OF "platform_events" DEFAULT;

-- CreateIndex
-- Declared on the parent; Postgres propagates each of these down to every
-- existing and future partition (including the DEFAULT one) automatically.
CREATE INDEX "platform_events_user_id_created_at_idx" ON "platform_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "platform_events_event_type_created_at_idx" ON "platform_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "platform_events_entity_type_entity_id_idx" ON "platform_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_events_created_at_idx" ON "platform_events"("created_at");

-- CreateTable
CREATE TABLE "platform_event_daily_rollups" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_event_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_event_daily_rollups_date_key" ON "platform_event_daily_rollups"("date");

-- CreateTable
-- admin_user_id is a plain TEXT column with NO foreign key to users — same
-- precedent already documented on reviews.resolved_by_user_id in
-- prisma/schema.prisma: an audit row must never be able to cascade-delete
-- just because the admin account that produced it was later removed. The
-- audit trail has to outlive the admin. Indefinite retention, and
-- deliberately NOT partitioned (unlike platform_events) since retention and
-- access rules differ.
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason_code" TEXT,
    "note" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx" ON "admin_audit_logs"("admin_user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "admin_audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at");

-- CreateTable
-- Fixed vendor costs (Supabase, Vercel, Upstash, Resend, Anthropic base
-- fees, etc.) — entered manually once per month (or per plan change), per
-- docs/ADMIN-CONSOLE-PLAN.md §4.5. This deliberately holds only the manual
-- half of the cost picture: AI spend (ai_usage_events.cost_micro_cents) and
-- payment-rail fees (the future transactions ledger, Phase 6) are *derived*
-- from their own event/ledger data, never entered here.
--
-- entered_by is a plain TEXT column with NO foreign key to users, same
-- reasoning as admin_audit_logs.admin_user_id above: this is a record of
-- who entered a figure, and it must survive that admin's account being
-- removed. Not partitioned — single-field id, like every other table in
-- this migration except platform_events.
CREATE TABLE "vendor_costs" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "period_month" DATE NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "note" TEXT,
    "entered_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One row per vendor per month — re-entering a month is an update, not a duplicate.
CREATE UNIQUE INDEX "vendor_costs_vendor_period_month_key" ON "vendor_costs"("vendor", "period_month");

-- CreateTable
-- Platform-wide daily metrics. analytics_daily_rollups (existing table) is
-- per-company and stays employer-facing; this is its deliberately separate
-- sibling, not a repurposing of it. Every admin chart reads this table,
-- never the live tables.
CREATE TABLE "platform_daily_rollups" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_daily_rollups_date_key" ON "platform_daily_rollups"("date");

-- CreateTable
-- reporter_user_id and resolved_by_user_id are plain TEXT columns with NO
-- foreign keys to users, same reasoning as admin_audit_logs.admin_user_id
-- above: a report is a historical record of what was reported and by/for
-- whom, and it must survive either party's account being removed rather
-- than cascade-deleting or leaving a dangling required relation.
CREATE TABLE "abuse_reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "severity" INTEGER NOT NULL DEFAULT 1,
    "resolved_by_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "abuse_reports_status_severity_created_at_idx" ON "abuse_reports"("status", "severity", "created_at");

-- CreateIndex
CREATE INDEX "abuse_reports_target_type_target_id_idx" ON "abuse_reports"("target_type", "target_id");

-- CreateTable
-- Admin RBAC. Unlike the plain-id precedent set by admin_audit_logs and
-- abuse_reports above, user_id here IS a real foreign key with
-- ON DELETE CASCADE, and is unique (1:1 with users). Those other tables are
-- history that must outlive the actor; this table is live authorization
-- state, not history — if the underlying user is gone, the admin profile
-- granting them access should go with it.
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" "AdminLevel" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_user_id_key" ON "admin_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: ai_usage_events — five new nullable columns. All nullable
-- because existing rows predate them, and cost is priced at call time: it
-- can never be reconstructed later from a rate card that has since changed,
-- so there is no backfill for these on old rows.
ALTER TABLE "ai_usage_events" ADD COLUMN "cost_micro_cents" INTEGER,
                               ADD COLUMN "model" TEXT,
                               ADD COLUMN "input_tokens" INTEGER,
                               ADD COLUMN "output_tokens" INTEGER,
                               ADD COLUMN "cached_tokens" INTEGER;

-- AlterTable: seeker_profiles — trust score columns. Continuous trust
-- scoring, recomputed nightly; trust_signals stores the component breakdown
-- so a low score is explainable.
ALTER TABLE "seeker_profiles" ADD COLUMN "trust_score" INTEGER,
                               ADD COLUMN "trust_score_updated_at" TIMESTAMP(3),
                               ADD COLUMN "trust_signals" JSONB;

-- CreateIndex
CREATE INDEX "seeker_profiles_trust_score_idx" ON "seeker_profiles"("trust_score");

-- AlterTable: companies — same trust score columns as seeker_profiles above.
ALTER TABLE "companies" ADD COLUMN "trust_score" INTEGER,
                         ADD COLUMN "trust_score_updated_at" TIMESTAMP(3),
                         ADD COLUMN "trust_signals" JSONB;

-- CreateIndex
CREATE INDEX "companies_trust_score_idx" ON "companies"("trust_score");
