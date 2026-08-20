import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { listJobAlerts } from "@/lib/job-alerts";
import JobAlertsList from "@/components/seeker/JobAlertsList";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import { Bell } from "lucide-react";

export default async function JobAlertsPage() {
  const { userId } = await requireSeekerPageContext();
  const alerts = await listJobAlerts(userId);

  const countLabel =
    alerts.length === 1 ? "1 active alert" : `${alerts.length} active alerts`;

  return (
    <div className="animate-fade-in pb-16">
      <SeekerNavBandBleed
        section="Job alerts"
        icon={Bell}
        badge={
          alerts.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
              {countLabel}
            </span>
          ) : undefined
        }
        hint="Saved searches"
      />

      <div className="pt-6 sm:pt-8">
        <JobAlertsList initialAlerts={alerts} />
      </div>
    </div>
  );
}
