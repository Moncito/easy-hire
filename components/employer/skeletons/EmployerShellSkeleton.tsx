import Bone from "@/components/employer/skeletons/Bone";

type Props = {
  children: React.ReactNode;
  expanded?: boolean;
};

export default function EmployerShellSkeleton({ children, expanded = false }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Bone className="h-8 w-56" />
          <Bone className="h-4 w-72 max-w-full" />
        </div>
        <Bone className="h-11 w-36 rounded-xl" />
      </div>
      {children}
    </div>
  );
}

export function EmployerRailSkeleton({ expanded = false }: { expanded?: boolean }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-navy ${
        expanded ? "w-52" : "w-[60px]"
      }`}
      aria-hidden="true"
    >
      <div className="flex h-14 items-center justify-center">
        <Bone className="h-8 w-8 rounded-full bg-mist/10" />
      </div>
      <div className="flex flex-1 flex-col items-center gap-2 px-2 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-10 w-10 rounded-xl bg-mist/10" />
        ))}
      </div>
      <div className="border-t border-white/5 p-2">
        <Bone className="mx-auto h-10 w-10 rounded-xl bg-mist/10" />
      </div>
    </aside>
  );
}

export function EmployerTopbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-ink/5 bg-mist/80 px-6 backdrop-blur-md">
      <Bone className="h-6 w-32" />
      <div className="flex items-center gap-3">
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-8 w-8 rounded-lg" />
      </div>
    </header>
  );
}
