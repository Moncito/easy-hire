import { RESUME_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { formatResume, parseResume } from "@/lib/seeker-profile-format";

/**
 * Signs a single stored resume value (bare object path, or a legacy full
 * URL from before the private-bucket migration) into a short-lived,
 * downloadable URL. Server-only — do not import from a "use client" file.
 */
export function signResumeUrl(stored: string | null | undefined) {
  return resolveSignedUrl(RESUME_BUCKET, stored);
}

/**
 * Signs the `resumeUrl` field and every entry in a pipe-encoded `resumes[]`
 * array on a seeker-shaped object, for DTOs that render both (the seeker's
 * own profile editor). Reuses one signed URL per unique stored path so
 * `resumeUrl` and its matching `resumes[]` entry stay string-equal — the
 * "which resume is primary" UI check depends on that equality.
 */
export async function hydrateResumeFields<
  T extends { resumeUrl?: string | null; resumes?: string[] | null },
>(seeker: T): Promise<T> {
  const resumes = seeker.resumes ?? [];
  const uniquePaths = Array.from(
    new Set(
      [seeker.resumeUrl, ...resumes.map((r) => parseResume(r).url)].filter(
        (v): v is string => Boolean(v)
      )
    )
  );

  const signedEntries = await Promise.all(
    uniquePaths.map(async (path) => [path, await signResumeUrl(path)] as const)
  );
  const signedByPath = new Map(signedEntries);

  return {
    ...seeker,
    resumeUrl: seeker.resumeUrl ? signedByPath.get(seeker.resumeUrl) ?? null : seeker.resumeUrl ?? null,
    resumes: resumes.map((raw) => {
      const parsed = parseResume(raw);
      const signed = parsed.url ? signedByPath.get(parsed.url) ?? parsed.url : parsed.url;
      return formatResume({ ...parsed, url: signed ?? "" });
    }),
  };
}
