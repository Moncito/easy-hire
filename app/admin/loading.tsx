export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-6 py-8">
      <div className="h-8 w-56 rounded-lg bg-ink/10" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
