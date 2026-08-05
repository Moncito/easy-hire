export default function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`employer-shimmer rounded-md bg-ink/8 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
