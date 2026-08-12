export default function JobsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-6 py-8">
      <div className="h-8 w-48 rounded-lg bg-ink/10" />
      <div className="mt-6 h-12 rounded-xl bg-ink/5" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
