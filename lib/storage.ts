import { ApiError } from "@/lib/api-error";
import { getPublicStorageUrl, getSupabaseAdmin } from "@/lib/supabase";

const RESUME_BUCKET = "resumes";
const LOGO_BUCKET = "logos";

const RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const LOGO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function assertFile(file: File, allowedTypes: Set<string>, maxBytes: number, label: string) {
  if (!file || file.size === 0) {
    throw new ApiError(`${label} file is required`, 400);
  }

  if (file.size > maxBytes) {
    throw new ApiError(`${label} must be under ${Math.round(maxBytes / (1024 * 1024))}MB`, 400);
  }

  const mime = file.type || "application/octet-stream";
  if (!allowedTypes.has(mime)) {
    throw new ApiError(`Unsupported ${label.toLowerCase()} file type`, 400);
  }
}

async function uploadObject(bucket: string, path: string, file: File) {
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new ApiError(`Upload failed: ${error.message}`, 500);
  }

  return getPublicStorageUrl(bucket, path);
}

export async function uploadResume(userId: string, file: File) {
  assertFile(file, RESUME_MIME_TYPES, MAX_RESUME_BYTES, "Resume");

  const path = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  return uploadObject(RESUME_BUCKET, path, file);
}

export async function uploadCompanyLogo(userId: string, file: File) {
  assertFile(file, LOGO_MIME_TYPES, MAX_LOGO_BYTES, "Logo");

  const path = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  return uploadObject(LOGO_BUCKET, path, file);
}
