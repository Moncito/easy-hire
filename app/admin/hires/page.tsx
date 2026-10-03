import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listHires, getHireStats } from "@/lib/admin/hires";
import HireDirectory from "@/components/admin/directory/HireDirectory";

/**
 * `/admin/hires` — every recorded hire and how it got recorded (accepted
 * offer vs. employer-marked), with whether the VA confirmed it. Read-only.
 * Permission matches the other Directory screens that expose people data.
 */
export default async function AdminHiresPage() {
  await requireAdminPagePermission("user.read");

  const [items, stats] = await Promise.all([listHires({ limit: 100 }), getHireStats()]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Directory</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Hires</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Every hire on EasyHire and how it was recorded.
        </p>
      </div>

      <HireDirectory items={items} stats={stats} />
    </div>
  );
}
