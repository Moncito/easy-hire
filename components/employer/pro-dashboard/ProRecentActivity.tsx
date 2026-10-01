import Link from "next/link";
import { Avatar, Card, CardHeader } from "@/components/employer/system";
import type { ActivityEvent } from "@/lib/employer/dashboard-decisions";

/**
 * Timeline of the latest applications and stage moves (shortlisted, moved
 * to interview, hired, declined), newest first. Times are formatted on the
 * server: relative under 14 days, a date after.
 */
export default function ProRecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <Card aria-labelledby="pro-activity-heading" padded={false} className="px-5 pb-2 pt-5 sm:px-6">
      <CardHeader id="pro-activity-heading" title="Recent activity" />
      {events.length === 0 ? (
        <p className="pb-4 pt-3 text-ui text-eh-muted">
          Nothing yet. Applications and stage changes will show up here.
        </p>
      ) : (
        <ol className="pt-2">
          {events.map((event, index) => (
            <li key={event.id} className="relative grid grid-cols-[auto_1fr] gap-2.5 py-2.5">
              {index < events.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-[-4px] left-[15px] top-[42px] w-px bg-eh-line" />
              )}
              <Avatar name={event.seekerName} src={event.seekerPhotoUrl} size="sm" />
              <div className="min-w-0">
                <Link href={event.href} className="text-ui text-eh-ink-2 transition hover:text-eh-ink">
                  <b className="font-semibold text-eh-ink">{event.seekerName}</b> {event.text}
                </Link>
                <p className="num text-xs text-eh-muted">
                  <time dateTime={event.at.toISOString()}>{event.timeLabel}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
