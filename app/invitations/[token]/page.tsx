import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import AcceptInvitation from "@/components/invitations/AcceptInvitation";
import { getCompanyInvitationPreview } from "@/lib/collaborative-hiring-team";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`);
  const invitation = await getCompanyInvitationPreview(token);
  return <AcceptInvitation token={token} invitation={invitation ? JSON.parse(JSON.stringify(invitation)) : null} signedInEmail={session.user.email} />;
}
