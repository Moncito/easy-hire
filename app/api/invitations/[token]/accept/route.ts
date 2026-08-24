import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { acceptCompanyInvitation } from "@/lib/collaborative-hiring-team";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Sign in to accept this invitation." }, { status: 401 });
    const { token } = await params;
    const invitation = await acceptCompanyInvitation(token, session.user.id, session.user.email);
    return NextResponse.json(invitation);
  } catch (error) {
    return errorResponse(error);
  }
}
