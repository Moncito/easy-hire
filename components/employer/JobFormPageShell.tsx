type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function JobFormPageShell({ title, description, children, footer }: Props) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink/50">{description}</p>}
      </div>
      {children}
      {footer}
    </>
  );
}
