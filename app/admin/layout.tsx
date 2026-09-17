import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import CommandPalette from "@/components/admin/CommandPalette";
import { requireAdminLayoutContext } from "@/lib/auth/admin-session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdminLayoutContext();
  if (!ctx) redirect("/login");

  // `ctx.access.permissions` is a `ReadonlySet<AdminPermission>` server-side —
  // Sets don't survive a Server -> Client Component prop boundary (RSC
  // serialization has no `Set` type), so it's converted to a plain array
  // here, once, rather than inside the client component. AdminSidebar stays
  // free of any `/lib` import — see that file's comment for why.
  const sidebarAccess = { level: ctx.access.level, permissions: Array.from(ctx.access.permissions) };
  const headerIdentity = { email: ctx.session.user.email ?? "", level: ctx.access.level };

  return (
    <div className="flex h-screen overflow-hidden bg-mist admin-dark:bg-admin-dark-bg">
      <AdminSidebar access={sidebarAccess} />
      {/* `paddingLeft` reads `--eh-sidebar-w` (app/globals.css), published by
          AdminSidebar itself as it collapses/expands — same CSS-var bridge
          ImpersonationBanner.tsx uses for its own height, since this Server
          Component can't hold the client-only collapse state directly.
          Defaults to 16rem (the CSS var's own default), matching the sidebar's
          static `w-64` before this component ever existed. */}
      <div className="flex min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-out" style={{ paddingLeft: "var(--eh-sidebar-w, 16rem)" }}>
        <AdminHeader identity={headerIdentity} />
        <main className="relative flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
      {/* Mounted once here (docs/ADMIN-CONSOLE-PLAN.md §5) so ⌘K/Ctrl+K works from every admin page. */}
      <CommandPalette />
    </div>
  );
}
