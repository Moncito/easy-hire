export default function SectionHeading({
  title,
  description,
  className = "",
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-ink/50">{description}</p>}
    </div>
  );
}
