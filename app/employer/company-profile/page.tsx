import { redirect } from "next/navigation";
import CompanyProfileEditor from "@/components/employer/CompanyProfileEditor";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getEmployerCompanyProfile } from "@/lib/companies";

export default async function CompanyProfilePage() {
  const { company: baseCompany } = await requireEmployerPageContext();

  const result = await getEmployerCompanyProfile(baseCompany.id);

  if (!result) {
    redirect("/employer/dashboard");
  }

  const { company, activeJobsCount, totalApplicantsCount } = result;

  const verificationStatusMap = {
    PENDING: "pending" as const,
    APPROVED: "verified" as const,
    REJECTED: "rejected" as const,
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Company Profile</h1>
        <p className="mt-1 text-sm text-ink/50">
          Manage your company&apos;s public identity and attract top virtual assistant talent.
        </p>
      </div>
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
