import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api-error";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new ApiError("File storage is not configured", 503);
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new ApiError("File storage is not configured", 503);
  }

  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
