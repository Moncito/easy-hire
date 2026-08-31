import { ImageResponse } from "next/og";

/**
 * Default Open Graph image for every route that doesn't define its own
 * (job/company/seeker pages currently don't set `openGraph.images`, so this
 * is what social previews fall back to). Generated at build/request time via
 * `next/og`'s ImageResponse rather than a committed binary — see the task
 * note in the PR description: `public/` only ships stock Next.js SVGs and we
 * don't want to add a hand-made asset that then silently drifts from the
 * brand palette.
 *
 * No custom brand font (Space Grotesk) is loaded here: `ImageResponse`
 * requires font data as a raw buffer (via `fetch`/`readFile`), and this repo
 * has no local font file checked in — `next/font/google` only produces
 * browser `<link>`/CSS output, not a buffer usable here. Falls back to
 * Satori's built-in sans-serif, which is legible and on-brand-enough for a
 * link preview; brand colors carry the identity instead.
 */
export const alt = "EasyHire VA Solutions — verified Filipino virtual assistants, hired direct";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "88px",
          // Harbor Navy -> Deep Ink, both structural brand colors.
          background: "linear-gradient(135deg, #1E3A5F 0%, #20242B 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 22,
              height: 22,
              borderRadius: 6,
              // Marigold — job-seeker accent, used here as the wordmark's dot.
              background: "#F2A93B",
            }}
          />
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontSize: 30,
              fontWeight: 700,
              // Mist White
              color: "#F5F6F4",
            }}
          >
            EasyHire VA Solutions
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 60,
            fontWeight: 700,
            color: "#F5F6F4",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Verified Filipino virtual assistants, hired direct.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 26,
            fontWeight: 600,
            color: "#F2A93B",
          }}
        >
          easyhire.ph
        </div>
      </div>
    ),
    { ...size }
  );
}
