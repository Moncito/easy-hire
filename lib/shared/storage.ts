import { ApiError } from "@/lib/api-error";
import { getPublicStorageUrl, getSignedStorageUrl, getSupabaseAdmin } from "@/lib/supabase";

/** Default TTL for signed URLs handed to the browser for private-bucket objects. */
export const SIGNED_URL_TTL_SECONDS = 300;

export const RESUME_BUCKET = "resumes";
export const VERIFICATION_DOC_BUCKET = "verification-docs";

export type BucketId = "resumes" | "logos" | "banners" | "photos" | "verification-docs";

type BucketConfig = {
  bucket: BucketId;
  /** Public buckets are served straight from the CDN; private buckets require a signed URL per read. */
  public: boolean;
  mimeTypes: Set<string>;
  maxBytes: number;
  label: string;
};

/**
 * Single source of truth for bucket visibility, MIME allowlist, and size cap.
 * Resumes and verification documents contain PII (RA 10173 data) and must
 * stay private; logos/banners/photos are meant to be publicly displayed.
 */
const BUCKETS: Record<BucketId, BucketConfig> = {
  resumes: {
    bucket: "resumes",
    public: false,
    mimeTypes: new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
    maxBytes: 5 * 1024 * 1024,
    label: "Resume",
  },
  "verification-docs": {
    bucket: "verification-docs",
    public: false,
    mimeTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    maxBytes: 5 * 1024 * 1024,
    label: "Verification document",
  },
  logos: {
    bucket: "logos",
    public: true,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    maxBytes: 2 * 1024 * 1024,
    label: "Logo",
  },
  banners: {
    bucket: "banners",
    public: true,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 3 * 1024 * 1024,
    label: "Banner",
  },
  photos: {
    bucket: "photos",
    public: true,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 2 * 1024 * 1024,
    label: "Photo",
  },
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/**
 * Magic-byte signatures for the file types we accept. `file.type` is
 * client-supplied and easily spoofed, so we sniff the real bytes too.
 *
 * | Claimed MIME type                                                          | Signature (hex)              |
 * |-----------------------------------------------------------------------------|-------------------------------|
 * | application/pdf                                                            | 25 50 44 46 ("%PDF")          |
 * | image/jpeg                                                                 | FF D8 FF                      |
 * | image/png                                                                  | 89 50 4E 47 ("\x89PNG")       |
 * | image/webp                                                                 | 52 49 46 46 ... "WEBP" (RIFF) |
 * | image/gif                                                                  | 47 49 46 38 ("GIF8")          |
 * | application/vnd...wordprocessingml.document (.docx)                       | 50 4B 03 04 ("PK\x03\x04")    |
 * | application/msword (.doc, legacy OLE)                                      | D0 CF 11 E0                   |
 */
const MAGIC_BYTES: Record<string, ((bytes: Uint8Array) => boolean)[]> = {
  "application/pdf": [(b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46],
  "image/jpeg": [(b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  "image/png": [(b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  "image/webp": [
    (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  ],
  "image/gif": [(b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  ],
  // Legacy .doc (OLE compound file) — msword can also be a modern .docx-shaped
  // zip in some producers, so accept either signature for this claimed type.
  "application/msword": [
    (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
    (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  ],
};

async function assertMagicBytes(file: File, mime: string, label: string) {
  const checks = MAGIC_BYTES[mime];
  if (!checks) return; // No signature on file for this type — allowlist check already gated the MIME.

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const matches = checks.some((check) => check(head));
  if (!matches) {
    throw new ApiError(`The ${label.toLowerCase()} file does not match its declared file type`, 400);
  }
}

async function assertFile(file: File, config: BucketConfig) {
  if (!file || file.size === 0) {
    throw new ApiError(`${config.label} file is required`, 400);
  }

  if (file.size > config.maxBytes) {
    throw new ApiError(`${config.label} must be under ${Math.round(config.maxBytes / (1024 * 1024))}MB`, 400);
  }

  const mime = file.type || "application/octet-stream";
  if (!config.mimeTypes.has(mime)) {
    throw new ApiError(`Unsupported ${config.label.toLowerCase()} file type`, 400);
  }

  await assertMagicBytes(file, mime, config.label);
}

async function ensureBucket(config: BucketConfig) {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new ApiError(`Storage setup failed: ${listError.message}`, 500);
  }

  if (buckets?.some((b) => b.name === config.bucket)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(config.bucket, {
    public: config.public,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    const visibility = config.public ? "public" : "private";
    throw new ApiError(
      `Storage bucket "${config.bucket}" is missing. Create a ${visibility} "${config.bucket}" bucket in Supabase Storage, or check service role permissions. (${createError.message})`,
      500
    );
  }
}

async function uploadObject(config: BucketConfig, path: string, file: File) {
  const supabase = getSupabaseAdmin();
  await ensureBucket(config);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(config.bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new ApiError(`Upload failed: ${error.message}`, 500);
  }

  return config.public ? getPublicStorageUrl(config.bucket, path) : path;
}

/**
 * Normalizes a stored value (which may be a legacy full URL or a bare object
 * path) down to the object path relative to its bucket. Handles both the
 * public (`/object/public/{bucket}/`) and signed (`/object/sign/{bucket}/`)
 * URL shapes — the latter matters because a signed URL can round-trip back
 * into storage (e.g. a form re-submitting a value it just displayed).
 */
export function toObjectPath(bucket: string, stored: string): string {
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

  // Unrecognized URL shape — return as-is (best effort; will fail signing upstream).
  return stored.split("?")[0];
}

/**
 * Resolves a stored value to a short-lived signed URL, safe to hand to a
 * browser. Returns `null` for null/empty input so DTOs can pass through
 * "no resume yet" without an extra branch at every call site.
 */
export async function resolveSignedUrl(
  bucket: string,
  stored: string | null | undefined,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!stored) return null;
  const path = toObjectPath(bucket, stored);
  if (!path) return null;
  return getSignedStorageUrl(bucket, path, ttlSeconds);
}

export async function uploadResume(userId: string, file: File) {
  const config = BUCKETS.resumes;
  await assertFile(file, config);

  const path = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  return uploadObject(config, path, file);
}

export async function uploadCompanyLogo(userId: string, file: File) {
  const config = BUCKETS.logos;
  await assertFile(file, config);

  const path = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  return uploadObject(config, path, file);
}

export async function uploadCompanyBanner(userId: string, file: File) {
  const config = BUCKETS.banners;
  await assertFile(file, config);

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/banner.${ext}`;
  const url = await uploadObject(config, path, file);
  return `${url}?v=${Date.now()}`;
}

export async function uploadSeekerPhoto(userId: string, file: File) {
  const config = BUCKETS.photos;
  await assertFile(file, config);

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/photo.${ext}`;
  const url = await uploadObject(config, path, file);
  return `${url}?v=${Date.now()}`;
}

export async function uploadUserAvatar(userId: string, file: File) {
  const config = BUCKETS.photos;
  await assertFile(file, config);

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/avatar.${ext}`;
  const url = await uploadObject(config, path, file);
  return `${url}?v=${Date.now()}`;
}

export async function uploadVerificationDocument(userId: string, file: File) {
  const config = BUCKETS["verification-docs"];
  await assertFile(file, config);

  const path = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const objectPath = await uploadObject(config, path, file);
  return { url: objectPath, fileName: sanitizeFilename(file.name) };
}

/**
 * @deprecated Kept only so pre-existing call sites keep compiling without a
 * change. Use `BucketId` (all buckets support programmatic deletion now).
 */
export type PrivateBucketId = "resumes" | "verification-docs";

/**
 * Deletes a single object from any bucket (private or public). Best-effort:
 * logs and swallows storage errors instead of throwing, so a flaky/slow
 * Supabase Storage call never rolls back a DB transaction (e.g. account
 * deletion) that has already committed. Callers that need to know about
 * failures should check server logs — this never blocks the caller's
 * success path.
 */
export async function deleteStorageObject(
  bucket: BucketId,
  stored: string | null | undefined
): Promise<void> {
  if (!stored) return;
  const path = toObjectPath(bucket, stored);
  if (!path) return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[storage] failed to delete ${bucket}/${path}: ${error.message}`);
    }
  } catch (error) {
    console.error(`[storage] failed to delete ${bucket}/${path}:`, error);
  }
}

/** @deprecated Thin alias kept for existing callers — use `deleteStorageObject` for new code. */
export const deletePrivateStorageObject = deleteStorageObject;
