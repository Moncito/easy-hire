import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import { listCompaniesForCollaborativeHiring, listPendingCompanies } from "@/lib/admin/companies";
import CompanyReviewQueue from "@/components/admin/CompanyReviewQueue";
import CollaborativeHiringAccess from "@/components/admin/CollaborativeHiringAccess";

export default async function AdminCompaniesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [companies, collaborativeCompanies] = await Promise.all([listPendingCompanies(), listCompaniesForCollaborativeHiring()]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Company verifications</h1>
        <p className="mt-2 text-sm text-ink/55">
          Review employer identities before their job listings appear on the public board.
        </p>
      </div>
      <CompanyReviewQueue initialCompanies={JSON.parse(JSON.stringify(companies))} />
      <CollaborativeHiringAccess initialCompanies={JSON.parse(JSON.stringify(collaborativeCompanies))} />
    </div>
  );
}
