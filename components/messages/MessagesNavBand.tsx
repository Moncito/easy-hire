import SeekerNavBand from "@/components/seeker/SeekerNavBand";
import { MessageSquare } from "lucide-react";

type Props = {
  unreadCount?: number;
  activeLabel?: string | null;
};

export default function MessagesNavBand({ unreadCount = 0, activeLabel }: Props) {
  const badge =
    unreadCount > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
        <span className="h-1.5 w-1.5 rounded-full bg-marigold" aria-hidden="true" />
        {unreadCount} unread
      </span>
    ) : undefined;

  return (
    <SeekerNavBand
      section="Messages"
      icon={MessageSquare}
      badge={badge}
      hint="Secure chat"
      metaLabel={activeLabel}
    />
  );
}
