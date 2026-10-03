# Staging and Release

How code gets from a feature branch to easyhireva.com. Shared between the owner and anyone else pushing code.

| Site | Branch | Database | Purpose |
| --- | --- | --- | --- |
| https://easyhireva.com | `main` | Supabase **production** | Live users |
| https://easy-hire-omega.vercel.app | `dev` | Supabase **staging** | Test before release |
| http://localhost:3000 | any | Supabase **staging** | Local development |

Supabase projects (org "Black Saint Directory"):
- Production: `easyhire-va-solutions-sg` (`mitkuegmpvdvrvowjnqv`, Singapore)
- Staging: `easyhire-staging` (`pmonckgkzmszkuycizcn`, Singapore) — created 2026-10-02; buckets, all 44 migrations and seed data in place (schema verified identical to production)
- Old pre-Singapore project `easyhire-va-solutions` (Sydney) — paused 2026-10-02 after the last 4 image links pointing at it were repointed to Singapore

Seed staging: put the staging values in `.env.staging` (gitignored), then `node scripts/seed-staging.mjs`.

Run the app locally against staging: `npm run dev:staging` (plain `npm run dev` still uses `.env`). It clears Next's dev data cache on start and exit, because that cache is keyed by query, not by database, and otherwise shows rows from whichever database the previous dev run used.

## Why staging gets its own database

Today local `.env` and both Vercel domains point at the same Supabase project. With a shared database, testing on omega:

- emails real users (on Vercel `NODE_ENV` is `production` on every deployment, so `EMAIL_TEST_RECIPIENT` is ignored — `lib/shared/email.ts` `resolveRecipient`);
- deletes real files from the shared `logos` / `banners` / `photos` buckets when a test account is deleted;
- changes production tables the moment a migration is applied "to test it";
- creates real-looking subscription / hire rows.

A second Supabase project removes all of that. The only cost is applying each migration twice.

## One-time setup

### 1. Supabase staging project
1. Create project `easyhire-staging`, region Southeast Asia (Singapore), same as production.
2. Storage: create public buckets `logos`, `banners`, `photos`.
3. Apply every migration:
   ```bash
   DATABASE_URL="<staging pooler url>" DIRECT_URL="<staging direct url>" npx prisma migrate deploy
   ```
   (`prisma migrate dev` is not used in this repo — migrations are hand-written; the owner's local `docs/` notes explain the checksum drift that blocks it.)
4. Seed test accounts: one admin, one Free employer, one Pro employer (`scripts/grant-employer-pro.mjs` against staging), two seekers, a few jobs.

### 2. Vercel
1. Settings → Git: Production Branch = `main`.
2. Settings → Domains: `easyhireva.com` → Production. `easy-hire-omega.vercel.app` → Git branch `dev`.
3. Settings → Environment Variables. Production values stay as they are. Add **Preview**-scoped values:

| Variable | Preview (staging) value |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | staging Supabase |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | staging Supabase |
| `NEXTAUTH_URL`, `APP_URL` | `https://easy-hire-omega.vercel.app` (without these, links fall back to the production URL — `lib/shared/app-url.ts`) |
| `AUTH_SECRET` | different from production |
| `CRON_SECRET` | different from production |
| `TOTP_ENCRYPTION_KEY` | different from production |
| `RESEND_API_KEY`, `EMAIL_FROM` | can stay shared with production: the staging guard sends only to `EMAIL_TEST_RECIPIENT` |
| `EMAIL_TEST_RECIPIENT` | owner's inbox |
| `GOOGLE_ID`, `GOOGLE_SECRET` | same client is fine; add `https://easy-hire-omega.vercel.app/api/auth/callback/google` to its authorized redirect URIs |
| AI keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`), `UPSTASH_*` | same or separate; separate keys make cost per environment visible |

4. Redeploy `dev` after changing env vars (Vercel only applies them to new deployments).

### 3. Local `.env`
Point `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` at **staging**. Local work must never touch production data. Keep production credentials out of `.env`; use them only for the production migration step below.

### 4. Crons
The five GitHub Actions workflows in `.github/workflows/cron-*.yml` call `vars.APP_BASE_URL` — keep that on production. Staging still needs the monthly `platform_events` partition from the admin-console cron, or event inserts fail there at the start of a month. Run it by hand on staging once a month, or add a staging copy of `cron-admin-console.yml` with `STAGING_BASE_URL` / `STAGING_CRON_SECRET`.

### 5. Bring `dev` up to date
`dev` is behind `main`. Before the first feature branch, merge `main` into `dev` so both start equal.

## Day-to-day flow

1. **Engineer** branches from `dev`: `feat/<short-name>`. Pushes and opens a PR into `dev`.
2. **Owner** pulls the branch, runs it locally against staging, tests, fixes anything broken on the same branch.
3. **Owner** merges the PR into `dev`. Omega redeploys. Test again on omega.
4. **Owner** opens a PR `dev` → `main`. Merging deploys easyhireva.com.
5. After the release, merge `main` back into `dev` if anything was hot-fixed on `main`.

Rules:
- Nobody pushes directly to `main` or `dev`. Everything goes through a PR.
- `main` only receives PRs from `dev` (hot-fix exception: owner only, then merge back into `dev`).
- Before any PR: `npm run lint`, `npm test`, `npm run build` pass.
- Backend work owns `prisma/`, `lib/`, `app/api/`. UI work owns `components/` and the pages under `app/`. When a feature needs both, the API contract is written in the feature's plan in `plans/` before UI starts.

## Migrations

1. Written by hand in the feature branch under `prisma/migrations/<timestamp>_<name>/migration.sql`, together with the `schema.prisma` change.
2. New tables need the owner's approval first (recorded in the owner's build plan).
3. **Additive only** in a single release: new tables, new nullable columns, new enum values. Renames and drops happen in a later release, after no deployed code reads the old shape. This keeps production working in the gap between migrating and deploying.
4. Applied to **staging** when the PR merges into `dev`.
5. Applied to **production** by the owner only, right before merging `dev` → `main`:
   ```bash
   DATABASE_URL="<prod pooler url>" DIRECT_URL="<prod direct url>" npx prisma migrate deploy
   ```
6. Stop `npm run dev` before `prisma generate` on Windows (the query engine DLL is locked while the dev server runs).

## Staging protections (shipped)

- Email: on staging, mail goes only to `EMAIL_TEST_RECIPIENT`; if it is unset, nothing is sent (`lib/shared/email.ts`, `lib/shared/deploy-env.ts`).
- `robots.txt` disallows everything and pages carry `noindex` off production.
- Corner label: "Testing environment" on omega, "Local · testing database" under `npm run dev:staging`, red "LIVE database" warning on plain `npm run dev`.
- Omega is also behind Vercel Authentication (Deployment Protection), so only the Vercel account owner can open it. Other people test with `npm run dev:staging` locally; the owner shares `.env.staging` values privately, never through git.
