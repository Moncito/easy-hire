import type { CSSProperties } from "react";

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-ink/8 ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export default function CompanyPageSkeleton() {
  return (
    <div className="animate-fade-in pb-20" style={{ background: "#F5F4F0" }}>
      <div className="companies-nav-band relative flex h-14 shrink-0 items-center justify-between px-6 sm:h-16 sm:px-8">
        <Bone className="h-6 w-40" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>

      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 1.5rem 4rem",
        }}
      >
        <Bone className="mb-8 h-4 w-28" />

        <Bone
          style={{
            width: "100%",
            height: 192,
            borderRadius: "14px 14px 0 0",
            background: "#E4E2DC",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1.125rem",
            paddingBottom: "1.5rem",
          }}
        >
          <Bone
            className="shrink-0"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              border: "4px solid #FFFFFF",
              marginTop: -48,
              boxSizing: "border-box",
            }}
          />
          <div style={{ paddingTop: 16, flex: 1 }}>
            <Bone className="mb-2 h-6 w-56 sm:w-72" />
            <Bone className="h-4 w-32" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E4E2DC] bg-white px-5 py-4"
            >
              <Bone className="mb-2 h-3 w-16" />
              <Bone className="h-5 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#E4E2DC] bg-white p-5 sm:p-6">
          <Bone className="mb-3 h-5 w-36" />
          <Bone className="h-4 w-full" />
          <Bone className="mt-2 h-4 w-full" />
          <Bone className="mt-2 h-4 w-2/3" />
        </div>

        <div className="mt-12">
          <Bone className="mb-6 h-6 w-40" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 rounded-xl border border-[#E4E2DC] bg-white px-5 py-5"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-5 w-3/4 max-w-sm" />
                  <Bone className="h-3 w-48" />
                  <Bone className="h-3 w-32" />
                </div>
                <Bone className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
