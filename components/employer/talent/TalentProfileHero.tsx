import Link from "next/link";
import { MapPin, Download } from "lucide-react";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";

type Props = {
  fullName: string;
  headline: string | null;
  location: string | null;
  photoUrl: string | null;
  seekerId: string;
  saved: boolean;
  canDownloadResume: boolean;
  resumeUrl: string | null;
};

export default function TalentProfileHero({
  fullName,
  headline,
  location,
  photoUrl,
  seekerId,
  saved,
  canDownloadResume,
  resumeUrl,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_12px_40px_-12px_rgba(30,58,95,0.45)] ring-1 ring-navy/20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(31,128,115,0.14)_0%,transparent_42%,rgba(255,255,255,0.04)_100%)]" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/15 blur-2xl" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <EmployerAvatar
          name={fullName}
          imageUrl={photoUrl}
          size="lg"
          shape="rounded"
          className="!h-16 !w-16 !rounded-2xl ring-2 ring-white/20"
          fallbackClassName="bg-teal/20 text-mist ring-2 ring-white/20"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-mist/50">Talent profile</p>
          <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-mist sm:text-2xl">
            {fullName}
          </h1>
          <p className="mt-1 text-sm text-mist/70">{headline || "Virtual Assistant"}</p>
          {location && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-mist/55">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <MessageSeekerButton seekerId={seekerId} />
          <SaveSeekerButton seekerId={seekerId} saved={saved} />
          {canDownloadResume && resumeUrl && (
            <a
              href={`/api/employer/talent/${seekerId}/resume`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-mist transition hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
