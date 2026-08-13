export default function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`employer-shimmer employer-ws-bone rounded-md ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
