import { ImageResponse } from "next/og";
import { BRAND_COLORS, brandMarkElement } from "@/components/brand/brandMarkImage";

// Home-screen icon for iOS. iOS rounds the corners itself and shows any
// transparency as black, so this uses a solid Mist White tile.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.mist,
        }}
      >
        {brandMarkElement(120)}
      </div>
    ),
    size
  );
}
