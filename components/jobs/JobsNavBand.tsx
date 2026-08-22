import SeekerNavBand from "@/components/seeker/SeekerNavBand";
import { Briefcase } from "lucide-react";
import Link from "next/link";

type Props = {
  isSeeker?: boolean;
  metaLabel?: string | null;
  profileCompleted?: number;
  profileTotal?: number;
};

export default function JobsNavBand({
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

  const guestActions = !isSeeker ? (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/login"
        className="cursor-pointer text-xs font-semibold text-ink/55 transition hover:text-ink sm:text-sm"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="cursor-pointer rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/90 sm:px-4 sm:text-sm"
      >
        Get started
      </Link>
    </div>
  ) : undefined;

  return (
    <SeekerNavBand
      className="jobs-nav-band shrink-0"
      section="Browse jobs"
      icon={Briefcase}
      hint="Find your next role"
      homeHref={isSeeker ? "/seeker/dashboard" : "/"}
      metaLabel={isSeeker ? metaLabel : null}
      badge={profileBadge}
      actions={guestActions}
      reserveCenter={isSeeker}
    />
  );
}
