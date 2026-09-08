import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import SeekerNotificationsList from "@/components/seeker/SeekerNotificationsList";
import { Bell } from "lucide-react";

export default async function SeekerNotificationsPage() {
  await requireSeekerPageContext();

  return (
    <div className="animate-fade-in pb-16">
      <SeekerNavBandBleed section="Notifications" icon={Bell} hint="All activity" />

      <div className="pt-6 sm:pt-8">
        <SeekerNotificationsList />
      </div>
    </div>
  );
}
