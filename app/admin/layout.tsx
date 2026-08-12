import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminLayoutContext } from "@/lib/auth/admin-session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdminLayoutContext();
  if (!ctx) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-mist">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-ink/5 bg-white/95 px-8 shadow-xs backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Admin Console</span>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
