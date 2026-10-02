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
