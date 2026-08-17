function Bone({ className }: { className?: string }) {
  return (
    <div className={`employer-shimmer employer-ws-bone rounded-md ${className ?? ""}`} aria-hidden="true" />
  );
}

export default function MessagesSkeleton({ showNavBand = false }: { showNavBand?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--ew-bg,#fff)]">
      {showNavBand && (
        <div className="messages-nav-band relative flex h-14 shrink-0 items-center justify-between px-6 sm:h-16 sm:px-8">
          <Bone className="h-6 w-28" />
          <Bone className="hidden h-4 w-16 lg:block" />
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden lg:flex-row">
        <aside className="flex w-full flex-col border-r border-ink/8 bg-[var(--ew-surface-muted,rgb(245_246_244/0.4))] lg:w-[min(360px,38%)] lg:max-w-[420px]">
          <div className="border-b border-ink/8 px-6 py-5 sm:px-8">
            <Bone className="h-7 w-32" />
            <Bone className="mt-2 h-3.5 w-44" />
            <div className="mt-4 flex gap-2">
              <Bone className="h-7 w-12 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
              <Bone className="h-7 w-20 rounded-full" />
            </div>
            <Bone className="mt-3 h-10 w-full rounded-xl" />
          </div>
          <div className="flex-1 space-y-1 px-4 py-2 sm:px-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-xl px-3 py-3">
                <Bone className="h-11 w-11 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex justify-between gap-2">
                    <Bone className="h-4 w-32" />
                    <Bone className="h-3 w-10" />
                  </div>
                  <Bone className="h-3 w-full" />
                  <Bone className="h-5 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="hidden min-h-0 flex-1 flex-col lg:flex">
          <div className="flex items-center gap-3 border-b border-ink/8 px-6 py-4">
            <Bone className="h-12 w-12 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Bone className="h-5 w-48" />
              <Bone className="h-3 w-36" />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end space-y-4 p-6">
            <div className="flex justify-start gap-2">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <Bone className="h-16 w-56 rounded-2xl rounded-tl-sm" />
            </div>
            <div className="flex justify-end">
              <Bone className="h-14 w-48 rounded-2xl rounded-tr-sm" />
            </div>
          </div>
          <div className="border-t border-ink/8 p-4">
            <Bone className="h-12 w-full rounded-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
