import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompanyProfileEditor from "@/components/employer/CompanyProfileEditor";
import { requireEmployerPageContext } from "@/lib/employer-session";

export default async function CompanyProfilePage() {
  const { company: baseCompany } = await requireEmployerPageContext();

  const company = await prisma.company.findUnique({
    where: { id: baseCompany.id },
    include: {
      verificationDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!company) {
    redirect("/employer/dashboard");
  }

  const [activeJobsCount, totalApplicantsCount] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
  ]);

  const verificationStatusMap = {
    PENDING: "pending" as const,
    APPROVED: "verified" as const,
    REJECTED: "rejected" as const,
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Company Profile</h1>
        <p className="mt-2 text-sm text-ink/60">
          Manage your company&apos;s public identity and attract top virtual assistant talent.
        </p>
      </div>
      <CompanyProfileEditor
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
