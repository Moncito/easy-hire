import { redirect } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { auth } from "@/Auth";
import RecruiterShell from "@/components/hiring/RecruiterShell";
import { getCollaboratorWorkspaceOverview } from "@/lib/collaborative-hiring-team";
import { getEmployerNotifications } from "@/lib/notifications";

export default async function WorkspaceNotificationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/notifications`)}`);
  const [overview, notifications] = await Promise.all([getCollaboratorWorkspaceOverview(companyId, session.user.id), getEmployerNotifications(session.user.id)]);
  return <RecruiterShell companyId={companyId} role={overview.membership.role} active="notifications"><main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9"><header className="border-b border-ink/10 pb-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A5B12]">Collaborative hiring</p><h1 className="mt-1 font-display text-3xl font-black">Notifications</h1></header>{notifications.length ? <div className="mt-5 divide-y border-y border-ink/10">{notifications.map((notification) => <article key={notification.id} className={`py-4 ${notification.readStatus ? "" : "border-l-2 border-teal pl-3"}`}><p className="text-sm text-ink/75">{notification.message}</p><p className="mt-1 text-xs text-ink/40">{notification.createdAt.toLocaleString()}</p></article>)}</div> : <div className="py-12 text-center"><Bell className="mx-auto h-7 w-7 text-teal" /><p className="mt-3 font-semibold">You&apos;re all caught up</p><p className="mt-1 text-sm text-ink/50">Hiring updates will appear here.</p></div>}<div className="mt-5 flex items-center gap-2 text-xs text-ink/45"><CheckCircle2 className="h-3.5 w-3.5 text-teal" />Workspace updates stay private to this hiring team.</div></main></RecruiterShell>;
}
