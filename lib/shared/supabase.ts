import { createClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import { ApiError } from "@/lib/api-error";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new ApiError("File storage is not configured", 503);
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node has no native WebSocket global before v22 (Vercel/local dev may
    // run older LTS) — @supabase/realtime-js needs one explicitly on the
    // server. Passing it unconditionally is harmless on newer Node too.
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  });
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new ApiError("File storage is not configured", 503);
  }

  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Mints a short-lived signed URL for an object in a private bucket. Unlike
 * `getPublicStorageUrl`, this requires a round-trip to Supabase Storage
 * because the URL embeds a time-boxed token.
 */
export async function getSignedStorageUrl(bucket: string, path: string, ttlSeconds: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);

  if (error || !data?.signedUrl) {
    throw new ApiError(`Could not generate a download link: ${error?.message ?? "unknown error"}`, 500);
  }

  return data.signedUrl;
}
