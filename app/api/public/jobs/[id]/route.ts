import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { getPublicJob } from "@/lib/public-jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await getPublicJob(id);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}
