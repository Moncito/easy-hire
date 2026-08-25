import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import { getEmployerNotifications } from "@/lib/notifications";

export default async function HiringNotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/hiring/notifications");
  const notifications = await getEmployerNotifications(session.user.id);
  return <main className="min-h-screen bg-mist px-5 py-8 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/hiring" className="text-sm font-semibold text-teal hover:underline">← All workspaces</Link><header className="mt-5 border-b border-ink/7 pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A5B12]">Collaborative hiring</p><h1 className="mt-1 font-display text-3xl font-black tracking-tighter text-ink">Notifications</h1></header>{notifications.length ? <div className="mt-5 divide-y divide-ink/7 overflow-hidden rounded-2xl border border-ink/8 bg-white">{notifications.map((notification) => <article key={notification.id} className={`px-5 py-4 ${notification.readStatus ? "" : "bg-teal/[0.03]"}`}><p className="text-sm text-ink/75">{notification.message}</p><p className="mt-1 text-xs text-ink/40">{notification.createdAt.toLocaleString()}</p></article>)}</div> : <div className="mt-8 text-center"><Bell className="mx-auto h-7 w-7 text-teal" /><p className="mt-3 font-semibold text-ink">You’re all caught up</p><p className="mt-1 text-sm text-ink/50">Hiring updates will appear here.</p></div>}<div className="mt-5 flex items-center gap-2 text-xs text-ink/45"><CheckCircle2 className="h-3.5 w-3.5 text-teal" />Scorecard updates are shared only with the assigned hiring team.</div></div></main>;
}
