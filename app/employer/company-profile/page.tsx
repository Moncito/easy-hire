import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import CompanyProfileEditor from "@/components/employer/CompanyProfileEditor";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getEmployerCompanyProfile } from "@/lib/companies";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProButton from "@/components/employer/pro/ProButton";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import Bone from "@/components/employer/skeletons/Bone";
import { isCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";

/**
 * Sync page so `app/employer/loading.tsx` can resolve immediately.
 * Next 16.2 + a route `loading.tsx` around a >200ms RSC render can
 * refetch `/employer/company-profile` forever.
 */
export default function CompanyProfilePage() {
  return (
    <Suspense fallback={<CompanyProfileFallback />}>
      <CompanyProfileContent />
    </Suspense>
  );
}

function CompanyProfileFallback() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      <Bone className="h-36 w-full rounded-2xl sm:h-44" />
      <Bone className="h-48 w-full rounded-2xl" />
    </div>
  );
}

async function CompanyProfileContent() {
  const { company: baseCompany, plan } = await requireEmployerPageContext();

  const [result, collaborativeHiringEnabled] = await Promise.all([
    getEmployerCompanyProfile(baseCompany.id),
    isCollaborativeHiringEnabled(baseCompany.id),
  ]);

  if (!result) {
    redirect("/employer/dashboard");
  }

  const { company, activeJobsCount, totalApplicantsCount } = result;
  const verified = company.verifiedStatus === "APPROVED";

  const verificationStatusMap = {
    PENDING: "pending" as const,
    APPROVED: "verified" as const,
    REJECTED: "rejected" as const,
  };

  const profileStats = (
    <>
      <span>
        <span className="font-data font-semibold text-ink">{activeJobsCount}</span>{" "}
        active role{activeJobsCount === 1 ? "" : "s"}
      </span>
      <span>
        <span className="font-data font-semibold text-ink">{totalApplicantsCount}</span>{" "}
        applicant{totalApplicantsCount === 1 ? "" : "s"}
      </span>
      {verified ? (
        <span className="font-semibold text-teal">Verified</span>
      ) : company.verifiedStatus === "REJECTED" ? (
        <a href="#verification" className="font-semibold text-ember hover:underline">
          Verification needs an update
        </a>
      ) : (
        <a href="#verification" className="font-semibold text-[#9A5B12] hover:underline">
          Verification pending
        </a>
      )}
    </>
  );

  const proDescription = verified
    ? "This is what VAs see. Verified Pro listings skip the admin queue and go live instantly."
    : company.verifiedStatus === "REJECTED"
      ? "Update documents below and request another review. Instant publish stays locked until you're verified."
      : "Finish verification to unlock instant publish. Pro never skips company verification — only the job-review wait.";

  return (
    <>
      {plan === "PRO" ? (
        <>
          <ProPageHeader
            title="Company"
            description={proDescription}
            stats={profileStats}
            actions={
              <>
                {collaborativeHiringEnabled && (
                  <ProButton href="/employer/team" variant="secondary">Manage team</ProButton>
                )}
                <ProButton
                  href={`/companies/${company.id}`}
                  variant="secondary"
                  icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                >
                  View public page
                </ProButton>
                <ProButton
                  href="/employer/jobs/new"
                  variant="primary"
                  icon={<Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
                >
                  Post a job
                </ProButton>
              </>
            }
          />
        </>
      ) : (
        <EmployerPageHeader
          title="Company Profile"
          description="Manage your company's public identity and attract top virtual assistant talent."
        />
      )}
      <CompanyProfileEditor
        companyId={company.id}
        initialData={{
          companyName: company.companyName,
          description: company.description,
          website: company.website,
          industry: company.industry,
          teamSize: company.teamSize,
          foundedYear: company.foundedYear,
          headquarters: company.headquarters,
          highlights: company.highlights,
          linkedinUrl: company.linkedinUrl,
          facebookUrl: company.facebookUrl,
          instagramUrl: company.instagramUrl,
          xUrl: company.xUrl,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          verificationStatus: verificationStatusMap[company.verifiedStatus] || "pending",
          verificationRejectionReason: company.verificationRejectionReason,
        }}
        stats={{
          activeJobsCount,
          totalApplicantsCount,
        }}
        verificationDocuments={company.verificationDocuments.map((doc) => ({
          id: doc.id,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          docType: doc.docType,
          uploadedAt: doc.uploadedAt.toISOString(),
        }))}
      />
      {collaborativeHiringEnabled && plan !== "PRO" && (
        <div className="mt-6 rounded-2xl border border-teal/15 bg-teal/5 p-5">
          <h2 className="font-display text-lg font-bold text-ink">Collaborative Hiring</h2>
          <p className="mt-1 text-sm text-ink/60">Your company is enabled for the pilot workspace.</p>
          <Link href="/employer/team" className="mt-3 inline-block text-sm font-semibold text-teal hover:underline">Manage hiring team</Link>
        </div>
      )}
    </>
  );
}
