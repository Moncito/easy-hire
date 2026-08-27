import Link from "next/link";
import { CalendarClock, Clock3, MapPin, Users, Video } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getCollaboratorWorkspaceOverview } from "@/lib/collaborative-hiring-team";
import { listCompanyInterviews } from "@/lib/collaborative-interviews";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

type Interview = Awaited<ReturnType<typeof listCompanyInterviews>>[number];

const formatIcon: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Clock3,
  IN_PERSON: MapPin,
};

function dateGroupLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function groupByDate(interviews: Interview[]) {
  const groups = new Map<string, { label: string; items: Interview[] }>();
  for (const interview of interviews) {
    const scheduledAt = new Date(interview.scheduledAt);
    const key = scheduledAt.toDateString();
    if (!groups.has(key)) groups.set(key, { label: dateGroupLabel(scheduledAt), items: [] });
    groups.get(key)!.items.push(interview);
  }
  return Array.from(groups.values());
}

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const s = await auth();
  const { companyId } = await params;
  if (!s?.user) redirect("/login");
  const [data, interviews] = await Promise.all([
    getCollaboratorWorkspaceOverview(companyId, s.user.id),
    listCompanyInterviews(companyId, s.user.id),
  ]);
  const groups = groupByDate(interviews);

  return (
    <>
      <header className="border-b border-ink/10 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A5B12]">Hiring calendar</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight">Interviews</h1>
        <p className="mt-2 text-sm text-ink/55">Upcoming interviews across the roles you can access.</p>
      </header>

      {interviews.length ? (
        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section key={group.label + group.items[0]?.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-[.1em] text-ink/50">{group.label}</h2>
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-ink/35">
                  {group.items.length} interview{group.items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70">
                {group.items.map((interview) => {
                  const FormatIcon = formatIcon[interview.format] ?? Clock3;
                  return (
                    <Link
                      key={interview.id}
                      href={`/hiring/${companyId}/jobs/${interview.application.job.id}/applications/${interview.application.id}`}
                      className="group flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-marigold/[0.05] sm:flex-nowrap"
                    >
                      <EmployerAvatar
                        name={interview.application.seeker.fullName}
                        imageUrl={interview.application.seeker.photoUrl}
                        size="md"
                        shape="rounded"
                        fallbackClassName="bg-navy/10 text-navy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {interview.application.seeker.fullName}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink/50">{interview.application.job.title}</span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy">
                        <Clock3 className="h-3 w-3" />
                        {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>

                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink/55">
                        <FormatIcon className="h-3 w-3" />
                        {interview.format.toLowerCase()} · {interview.durationMins}m
                      </span>

                      {interview.participants.length > 0 && (
                        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-ink/40 sm:flex">
                          <Users className="h-3.5 w-3.5" />
                          {interview.participants.map((p) => p.member.user.email).join(", ")}
                        </span>
                      )}

                      <span className="ml-auto shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-[#9A5B12]">→</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-ink/10 bg-white/60 py-14 text-center text-sm text-ink/50">
          <CalendarClock className="mx-auto h-6 w-6 text-teal" />
          <p className="mt-3 font-semibold text-ink/70">No interviews scheduled yet</p>
          <p className="mt-1">Schedule interviews from a candidate review. They will appear here across all roles.</p>
        </div>
      )}
    </>
  );
}
