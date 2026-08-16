import { redirect } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import CompanyProfileEditor from "@/components/employer/CompanyProfileEditor";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getEmployerCompanyProfile } from "@/lib/companies";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProCompanyPerkStrip from "@/components/employer/pro-dashboard/ProCompanyPerkStrip";
import ProButton from "@/components/employer/pro/ProButton";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";

export default async function CompanyProfilePage() {
  const { company: baseCompany, plan } = await requireEmployerPageContext();

  const result = await getEmployerCompanyProfile(baseCompany.id);

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
          <ProCompanyPerkStrip
            companyVerified={verified}
            publicHref={`/companies/${company.id}`}
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
    </>
  );
}
