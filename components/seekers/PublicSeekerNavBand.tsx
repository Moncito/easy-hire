import SeekerNavBand from "@/components/seeker/SeekerNavBand";
import { User } from "lucide-react";

type Props = {
  isSeeker?: boolean;
  metaLabel?: string | null;
  profileCompleted?: number;
  profileTotal?: number;
};

export default function PublicSeekerNavBand({
  isSeeker = false,
  metaLabel,
  profileCompleted,
  profileTotal,
}: Props) {
  const profileBadge =
    isSeeker && profileTotal != null && profileTotal > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
        {profileCompleted ?? 0}/{profileTotal} profile
      </span>
    ) : undefined;

  return (
    <SeekerNavBand
      className="seekers-nav-band shrink-0"
      section="Talent profile"
      icon={User}
      hint="Public VA profile"
      homeHref={isSeeker ? "/seeker/dashboard" : "/"}
      metaLabel={isSeeker ? metaLabel : null}
      badge={profileBadge}
    />
  );
}
