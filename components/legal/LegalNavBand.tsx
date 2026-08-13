import SeekerNavBand from "@/components/seeker/SeekerNavBand";
import type { LucideIcon } from "lucide-react";

type Props = {
  section: string;
  icon: LucideIcon;
  hint?: string;
  isSeeker?: boolean;
  metaLabel?: string | null;
};

export default function LegalNavBand({
  section,
  icon,
  hint = "Platform info",
  isSeeker = false,
  metaLabel,
}: Props) {
  return (
    <SeekerNavBand
      className="legal-nav-band shrink-0"
      section={section}
      icon={icon}
      hint={hint}
      homeHref={isSeeker ? "/seeker/dashboard" : "/"}
      metaLabel={isSeeker ? metaLabel : null}
    />
  );
}

export function LegalNavBandBleed(props: Props) {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <LegalNavBand {...props} />
    </div>
  );
}
