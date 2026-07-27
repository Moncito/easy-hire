import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import { listPendingJobs } from "@/lib/admin/jobs";
import JobReviewQueue from "@/components/admin/JobReviewQueue";

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const jobs = await listPendingJobs();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Job approvals</h1>
        <p className="mt-2 text-sm text-ink/55">
          Review employer job postings before they go live on the public board.
        </p>
      </div>
      <JobReviewQueue initialJobs={JSON.parse(JSON.stringify(jobs))} />
    </div>
  );
}
