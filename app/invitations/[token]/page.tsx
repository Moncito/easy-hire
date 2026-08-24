import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import AcceptInvitation from "@/components/invitations/AcceptInvitation";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`);
  return <AcceptInvitation token={token} />;
}
