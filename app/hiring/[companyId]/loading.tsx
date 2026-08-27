import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Fallback shown while the workspace layout resolves (auth + membership checks)
 * on a hard navigation or refresh into a workspace URL. Route segments with
 * their own loading.tsx (messages, reports, …) override this.
 */
export default function Loading() {
  return <FullScreenLoader label="Opening workspace…" sublabel="Checking your access" />;
}
