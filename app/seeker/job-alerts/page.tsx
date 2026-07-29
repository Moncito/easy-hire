import { auth } from "@/Auth";
import { listJobAlerts } from "@/lib/job-alerts";
import JobAlertsList from "@/components/seeker/JobAlertsList";

export default async function JobAlertsPage() {
  const session = await auth();
  const alerts = session?.user ? await listJobAlerts(session.user.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Job alerts</h1>
        <p className="mt-2 text-sm text-ink/55">
          Saved searches that notify you when a matching VA role goes live.
        </p>
      </div>

      <JobAlertsList initialAlerts={alerts} />
    </div>
  );
}
