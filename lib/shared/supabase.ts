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
