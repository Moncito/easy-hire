type Props = {
  as?: "h1" | "h2";
  id?: string;
  className?: string;
};

export default function AuthHeader({ as: Heading = "h1", id, className = "" }: Props) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-navy">Welcome back</p>
      <Heading id={id} className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Sign in to EasyHire
      </Heading>
      <p className="mt-1.5 text-sm text-ink/65">
        Pick up where you left off — jobs, applications, and hiring.
      </p>
    </div>
  );
}
