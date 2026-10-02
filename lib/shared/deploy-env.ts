/**
 * Which deployment this process is: the live site, staging, or a developer
 * machine.
 *
 * `NODE_ENV` cannot answer this on Vercel — it is "production" on every
 * deployment, including Preview ones like the staging domain. `VERCEL_ENV` is
 * set by Vercel on every deployment ("production" | "preview" | "development")
 * and is the only reliable signal there. Off Vercel (local `next dev` /
 * `next start`), fall back to `NODE_ENV`.
 *
 * See docs/STAGING-AND-RELEASE.md.
 */
export type DeployEnv = "production" | "staging" | "development";

export function getDeployEnv(env: Record<string, string | undefined> = process.env): DeployEnv {
  const vercelEnv = env.VERCEL_ENV?.trim();
  if (vercelEnv) return vercelEnv === "production" ? "production" : "staging";
  return env.NODE_ENV === "production" ? "production" : "development";
}

export const DEPLOY_ENV = getDeployEnv();

/** False on staging and local dev — gates indexing, real-recipient email and the staging banner. */
export const IS_PRODUCTION_DEPLOYMENT = DEPLOY_ENV === "production";

export type EnvironmentBadge = { label: string; tone: "testing" | "live-data" };

/**
 * The corner label that says which data this deployment is touching. None on
 * the live site. Locally it has to name the DATABASE, not the deployment:
 * plain `npm run dev` reads `.env`, which points at production, so calling it
 * "staging" would be wrong exactly when it matters most. `npm run dev:staging`
 * (scripts/dev-staging.mjs) sets LOCAL_DATABASE=staging.
 */
export function getEnvironmentBadge(
  env: Record<string, string | undefined> = process.env
): EnvironmentBadge | null {
  const deployEnv = getDeployEnv(env);
  if (deployEnv === "production") return null;
  if (deployEnv === "staging") return { label: "Testing environment · not the live site", tone: "testing" };
  if (env.LOCAL_DATABASE?.trim() === "staging") return { label: "Local · testing database", tone: "testing" };
  return { label: "Local · LIVE database — real users' data", tone: "live-data" };
}

export const ENVIRONMENT_BADGE = getEnvironmentBadge();
