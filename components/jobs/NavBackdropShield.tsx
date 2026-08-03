type Props = {
  /** `reserved` = fixed mist block for marketing/guest nav. `overlay` = backdrop only when expanded. */
  variant?: "reserved" | "overlay";
  /** When true (overlay mode), show a subtle backdrop behind the expanded pill. */
  expanded?: boolean;
};

/** Blocks scroll content from showing through gaps around the floating pill navbar. */
export default function NavBackdropShield({ variant = "reserved", expanded = false }: Props) {
  if (variant === "overlay") {
    if (!expanded) return null;
    return (
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-20 bg-mist/80 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[88px] bg-mist" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-x-0 top-[88px] z-40 h-8 bg-gradient-to-b from-mist to-transparent"
        aria-hidden="true"
      />
    </>
  );
}
