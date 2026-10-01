export function BrandMark({ className = "h-6 w-6 sm:h-7 sm:w-7" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <div
        className="absolute inset-0 bg-marigold"
        style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }}
      />
      <div
        className="absolute inset-0 bg-teal"
        style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
      />
    </div>
  );
}

export function BrandLockup({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const mark = size === "md" ? "h-9 w-9" : "h-6 w-6 sm:h-7 sm:w-7";
  const text = size === "md" ? "text-xl" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className={mark} />
      <span className={`font-display font-bold text-ink ${text}`}>EasyHire</span>
    </span>
  );
}
