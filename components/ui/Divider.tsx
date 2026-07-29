export default function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-ink/8 ${className}`} aria-hidden="true" />;
}
