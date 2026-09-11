import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminPageContext } from "@/lib/auth/admin-session";
import { getCompanyDetail } from "@/lib/admin/companies";
import { ApiError } from "@/lib/api-error";
import CompanyDetailView from "@/components/admin/directory/CompanyDetailView";

/**
 * `/admin/companies/[id]` — company detail (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3/§3, Phase 2): "plan, jobs, members, risk signals, AI spend." Server
 * component calls `getCompanyDetail` directly (§5: "Server components for
 * reads") — that function itself records the `COMPANY_RECORD_VIEWED`
 * PII-read audit row.
 */
export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: adminUserId } = await requireAdminPageContext();
  const { id } = await params;

  let detail;
  try {
    detail = await getCompanyDetail(adminUserId, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to user directory
        </Link>
      </div>

      <CompanyDetailView detail={JSON.parse(JSON.stringify(detail))} />
    </div>
  );
}
