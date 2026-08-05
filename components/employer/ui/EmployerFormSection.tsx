type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Hide bottom border on the last section */
  last?: boolean;
};

export default function EmployerFormSection({
  title,
  description,
  children,
  last = false,
}: Props) {
  return (
    <section className={last ? "pb-2" : "border-b border-ink/5 pb-8"}>
      <div className="mb-5">
        <h2 className="font-display text-base font-bold tracking-tight text-ink">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink/45">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
