// `npm run dev:staging` — runs `next dev` against the STAGING Supabase project
// instead of whatever `.env` points at. See plans/STAGING-AND-RELEASE.md.
//
// Values from `.env.staging` are put into the process environment before
// Next starts, and Next never overrides a variable that is already set, so
// they win over `.env` / `.env.local` for this run only. Everything not in
// `.env.staging` (auth secret, OAuth, AI keys...) still comes from `.env`.
//
// The dev data cache (unstable_cache results, persisted under
// .next/dev/cache/fetch-cache) is keyed by query, not by database, so it
// would serve rows from whichever database the previous `next dev` used —
// production jobs on staging, or staging jobs on the next plain `npm run dev`.
// It is cleared on start and on exit.

import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { config } from "dotenv";

const DEV_DATA_CACHE = ".next/dev/cache/fetch-cache";

if (!existsSync(".env.staging")) {
  console.error("Missing .env.staging — see plans/STAGING-AND-RELEASE.md.");
  process.exit(1);
}

config({ path: ".env.staging", override: true, quiet: true });
// Read by getEnvironmentBadge (lib/shared/deploy-env.ts) for the corner label.
process.env.LOCAL_DATABASE = "staging";
// A local run must never build redirects or email links for the live domain,
// whatever `.env` says (it may carry the production NEXTAUTH_URL).
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.APP_URL = "http://localhost:3000";
process.env.AUTH_URL = "http://localhost:3000";

function clearDevDataCache() {
  rmSync(DEV_DATA_CACHE, { recursive: true, force: true });
}

clearDevDataCache();

const child = spawn("npx", ["next", "dev", "--webpack", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code) => {
  clearDevDataCache();
  process.exit(code ?? 0);
});
