// Phase 1.1 backfill: move `resumes` and `verification-docs` from public to
// private Supabase Storage buckets, and rewrite the DB columns that used to
// hold full public URLs (`.../object/public/{bucket}/{path}`) down to bare
// object paths (`{path}`), matching what `lib/shared/storage.ts` now expects.
//
// The object bytes themselves don't move — the bucket name is unchanged, we
// only flip its `public` flag and normalize how the path is stored in
// Postgres. Running this script twice is safe: any row/URL that's already a
// bare path is left untouched.
//
// Usage:
//   node scripts/migrate-private-storage.mjs            # dry run (default)
//   node scripts/migrate-private-storage.mjs --apply     # writes changes
//
// Mirrors the style of scripts/grant-employer-pro.mjs.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import WebSocket from "ws";

config();

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient();

const RESUME_BUCKET = "resumes";
const VERIFICATION_DOC_BUCKET = "verification-docs";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node has no native WebSocket global before v22 (Vercel/local dev may
    // run older LTS) — @supabase/realtime-js needs one explicitly on the
    // server. Passing it unconditionally is harmless on newer Node too.
    realtime: { transport: WebSocket },
  });
}

/**
 * Same normalization as `lib/shared/storage.ts:toObjectPath` — duplicated
 * here because this script runs standalone via plain `node`, outside of
 * Next's TS/path-alias resolution.
 */
function toObjectPath(bucket, stored) {
  if (!stored) return stored;
  if (!stored.startsWith("http")) {
    return stored.split("?")[0];
  }

  const markers = [`/object/public/${bucket}/`, `/object/sign/${bucket}/`];
  for (const marker of markers) {
    const index = stored.indexOf(marker);
    if (index !== -1) {
      return stored.slice(index + marker.length).split("?")[0];
    }
  }

  return stored.split("?")[0];
}

function parseResumeEntry(raw) {
  const [label = "", url = "", updatedAt = ""] = raw.split("|");
  return { label, url, updatedAt };
}

function formatResumeEntry({ label, url, updatedAt }) {
  return [label, url, updatedAt].join("|");
}

async function migrateSeekerResumes() {
  const seekers = await prisma.seekerProfile.findMany({
    select: { id: true, resumeUrl: true, resumes: true },
  });

  let touchedRows = 0;
  let touchedValues = 0;

  for (const seeker of seekers) {
    const newResumeUrl = seeker.resumeUrl ? toObjectPath(RESUME_BUCKET, seeker.resumeUrl) : seeker.resumeUrl;
    const newResumes = seeker.resumes.map((raw) => {
      const parsed = parseResumeEntry(raw);
      const newUrl = parsed.url ? toObjectPath(RESUME_BUCKET, parsed.url) : parsed.url;
      return { raw, next: formatResumeEntry({ ...parsed, url: newUrl }), changed: newUrl !== parsed.url };
    });

    const resumeUrlChanged = newResumeUrl !== seeker.resumeUrl;
    const resumesChanged = newResumes.some((r) => r.changed);

    if (!resumeUrlChanged && !resumesChanged) continue;

    touchedRows += 1;
    touchedValues += (resumeUrlChanged ? 1 : 0) + newResumes.filter((r) => r.changed).length;

    console.log(
      `[seeker ${seeker.id}] resumeUrl: ${seeker.resumeUrl ?? "(none)"} -> ${newResumeUrl ?? "(none)"}` +
        (resumesChanged ? ` · ${newResumes.filter((r) => r.changed).length} resumes[] entr${newResumes.filter((r) => r.changed).length === 1 ? "y" : "ies"} normalized` : "")
    );

    if (APPLY) {
      await prisma.seekerProfile.update({
        where: { id: seeker.id },
        data: {
          resumeUrl: newResumeUrl,
          resumes: newResumes.map((r) => r.next),
        },
      });
    }
  }

  console.log(`\nSeeker profiles: ${touchedRows} row(s), ${touchedValues} value(s) ${APPLY ? "updated" : "would be updated"}.`);
}

async function migrateVerificationDocuments() {
  const documents = await prisma.verificationDocument.findMany({
    select: { id: true, fileUrl: true },
  });

  let touched = 0;

  for (const doc of documents) {
    const newFileUrl = toObjectPath(VERIFICATION_DOC_BUCKET, doc.fileUrl);
    if (newFileUrl === doc.fileUrl) continue;

    touched += 1;
    console.log(`[verification-doc ${doc.id}] fileUrl: ${doc.fileUrl} -> ${newFileUrl}`);

    if (APPLY) {
      await prisma.verificationDocument.update({
        where: { id: doc.id },
        data: { fileUrl: newFileUrl },
      });
    }
  }

  console.log(`\nVerification documents: ${touched} row(s) ${APPLY ? "updated" : "would be updated"}.`);
}

async function makeBucketPrivate(supabase, bucket) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error(`Could not list buckets: ${listError.message}`);
    return;
  }

  const existing = buckets?.find((b) => b.name === bucket);
  if (!existing) {
    console.log(`[bucket ${bucket}] does not exist yet — nothing to flip (it will be created private on first upload).`);
    return;
  }

  if (existing.public === false) {
    console.log(`[bucket ${bucket}] already private.`);
    return;
  }

  console.log(`[bucket ${bucket}] currently public -> ${APPLY ? "flipping to private" : "would flip to private"}.`);
  if (APPLY) {
    const { error } = await supabase.storage.updateBucket(bucket, { public: false });
    if (error) {
      console.error(`Could not update bucket "${bucket}": ${error.message}`);
    }
  }
}

async function main() {
  console.log(APPLY ? "Running with --apply: changes WILL be written.\n" : "Dry run (pass --apply to write changes).\n");

  const supabase = getSupabaseAdmin();
  await makeBucketPrivate(supabase, RESUME_BUCKET);
  await makeBucketPrivate(supabase, VERIFICATION_DOC_BUCKET);

  console.log("");
  await migrateSeekerResumes();
  console.log("");
  await migrateVerificationDocuments();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
