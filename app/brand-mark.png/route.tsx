import { ImageResponse } from "next/og";
import { brandMarkElement } from "@/components/brand/brandMarkImage";

// Stable, absolute-URL logo for transactional emails (lib/shared/email-layout.ts).
// app/icon.tsx's URL carries a build hash, so emails can't point at it.
// Rendered at 2x the 28px display size for retina clients.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
        {brandMarkElement(56)}
      </div>
    ),
    { width: 56, height: 56 }
  );
}
