import Link from "next/link";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import type { ActivityEvent } from "@/lib/employer/dashboard-decisions";

/**
 * Timeline of the latest applications and stage moves (shortlisted, moved
 * to interview, hired, declined), newest first. Times are formatted on the
 * server: relative under 14 days, a date after.
 */
export default function ProRecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <section
      aria-labelledby="pro-activity-heading"
      className="rounded-card border border-eh-line bg-eh-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <h2 id="pro-activity-heading" className="px-5 pt-4 text-card-title text-eh-ink">
        Recent activity
      </h2>
      {events.length === 0 ? (
        <p className="px-5 pb-5 pt-3 text-ui text-eh-muted">
          Nothing yet. Applications and stage changes will show up here.
        </p>
      ) : (
        <ol className="px-5 pb-4 pt-1.5">
          {events.map((event, index) => (
            <li key={event.id} className="relative grid grid-cols-[auto_1fr] gap-2.5 py-2.5">
              {index < events.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-[-4px] left-[15px] top-[42px] w-px bg-eh-line" />
              )}
              <EmployerAvatar name={event.seekerName} imageUrl={event.seekerPhotoUrl} size="sm" />
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
    </section>
  );
}
