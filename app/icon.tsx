import { ImageResponse } from "next/og";
import { brandMarkElement } from "@/components/brand/brandMarkImage";

// Browser-tab favicon. Replaces the Create Next App favicon.ico that shipped
// from the initial scaffold.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
        {brandMarkElement(30)}
      </div>
    ),
    size
  );
}
