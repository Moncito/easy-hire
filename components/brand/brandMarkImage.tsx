// The EasyHire split-circle mark as a plain element tree for `next/og`'s
// ImageResponse (favicon, Apple touch icon, social image, email logo). Satori
// has no clip-path support, so the diagonal split is a hard-stop gradient:
// 135deg puts Marigold top-left and Signal Teal bottom-right, matching the
// clip-path version in BrandMark.tsx.

export const BRAND_COLORS = {
  marigold: "#F2A93B",
  teal: "#1F8073",
  navy: "#1E3A5F",
  ink: "#20242B",
  mist: "#F5F6F4",
} as const;

export function brandMarkElement(size: number) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${BRAND_COLORS.marigold} 50%, ${BRAND_COLORS.teal} 50%)`,
      }}
    />
  );
}
