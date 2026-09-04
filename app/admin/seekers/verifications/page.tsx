import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import { listPendingSeekerVerifications } from "@/lib/admin/seekers";
import SeekerVerificationQueue from "@/components/admin/SeekerVerificationQueue";

export default async function AdminSeekerVerificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const seekers = await listPendingSeekerVerifications();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Seeker verifications</h1>
        <p className="mt-2 text-sm text-ink/55">
          Review VA identity documents before approving their &ldquo;identity confidence&rdquo; badge. This
          confirms the person is real and reachable — it is not an assessment of their skill or work quality.
        </p>
      </div>
      <SeekerVerificationQueue initialSeekers={JSON.parse(JSON.stringify(seekers))} />
    </div>
  );
}
