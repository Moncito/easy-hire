import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import ProfilePhotoForm from "@/components/account/ProfilePhotoForm";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Fprofile");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, avatarUrl: true } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-mist px-6 py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Your profile</h1>
      <p className="mt-1 text-sm text-ink/55">
        This photo shows up wherever your teammates see you — messages, activity notes, and shared workspaces.
      </p>
      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_10px_30px_rgba(32,36,43,0.04)]">
        <ProfilePhotoForm email={user.email} initialAvatarUrl={user.avatarUrl} />
      </div>
    </div>
  );
}
