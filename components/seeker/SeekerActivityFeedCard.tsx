import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  MessageSquare,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { notificationHref } from "@/lib/notifications";
import { relativeTime } from "@/lib/time-ago";

export type SeekerActivityItem = {
  id: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: Date;
};

type Props = {
  items: SeekerActivityItem[];
  viewAllHref?: string;
};

/**
 * Read-only glance card — deliberately does NOT mark items read or paginate.
 * That stays exclusively /seeker/notifications's job (SeekerNotificationsList),
 * so a dashboard visit can't silently zero the bell's unread badge without
 * the seeker actually reading anything.
 */
const TYPE_STYLE: Record<string, { icon: LucideIcon; chip: string; unreadBg: string; bar: string }> = {
  NEW_MESSAGE: { icon: MessageSquare, chip: "bg-teal/10 text-teal", unreadBg: "bg-teal/[0.05]", bar: "bg-teal" },
  INTERVIEW_SCHEDULED: { icon: Calendar, chip: "bg-navy/8 text-navy", unreadBg: "bg-navy/[0.04]", bar: "bg-navy" },
  APPLICATION_REJECTED: {
    icon: AlertCircle,
    chip: "bg-ember/10 text-ember",
    unreadBg: "bg-ember/[0.05]",
    bar: "bg-ember",
  },
  SEEKER_ID_APPROVED: { icon: ShieldCheck, chip: "bg-teal/10 text-teal", unreadBg: "bg-teal/[0.05]", bar: "bg-teal" },
  SEEKER_ID_REJECTED: {
    icon: AlertCircle,
    chip: "bg-ember/10 text-ember",
    unreadBg: "bg-ember/[0.05]",
    bar: "bg-ember",
  },
  APPLICATION_SUBMITTED: {
    icon: Send,
    chip: "bg-marigold/15 text-[#8a5a10]",
    unreadBg: "bg-marigold/[0.05]",
    bar: "bg-marigold",
  },
};

const DEFAULT_STYLE = {
  icon: Bell,
  chip: "bg-marigold/15 text-[#8a5a10]",
  unreadBg: "bg-marigold/[0.05]",
  bar: "bg-marigold",
};

function styleFor(type: string) {
  return TYPE_STYLE[type] ?? DEFAULT_STYLE;
}

export default function SeekerActivityFeedCard({ items, viewAllHref = "/seeker/notifications" }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Activity</p>
        <Link href={viewAllHref} className="text-xs font-semibold text-ink/40 hover:text-navy">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink/45">
          Nothing yet — application updates, messages, and interview invites land here.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => {
            const { icon: Icon, chip, unreadBg, bar } = styleFor(item.type);
            const href = notificationHref(item.type, "SEEKER") ?? "/seeker/dashboard";
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={`group relative flex items-start gap-3 overflow-hidden rounded-xl px-2.5 py-2 transition hover:bg-ink/[0.03] ${
                    !item.readStatus ? unreadBg : ""
                  }`}
                >
                  {!item.readStatus && (
                    <span className={`absolute inset-y-1.5 left-0 w-[3px] rounded-full ${bar}`} aria-hidden="true" />
                  )}
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-2 text-xs group-hover:text-ink ${
                        item.readStatus ? "text-ink/60" : "font-medium text-ink/80"
                      }`}
                    >
                      {item.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink/35">{relativeTime(item.createdAt.toISOString())}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
