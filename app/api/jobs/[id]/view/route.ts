import { NextResponse } from "next/server";
import { recordJobView, getSessionHashFromRequest } from "@/lib/employer-analytics";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionHash = await getSessionHashFromRequest();
    await recordJobView(id, sessionHash);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
