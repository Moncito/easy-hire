import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerJob } from "@/lib/employer-auth";
import { getHiringSetup, saveHiringSetup } from "@/lib/hiring-setup";
import { hiringSetupSchema } from "@/lib/validations/hiring-setup";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await auth(); if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { id } = await params; const { company } = await requireEmployerJob(session.user.id, id); return NextResponse.json(await getHiringSetup(company.id, session.user.id, id)); } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await auth(); if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { id } = await params; const { company } = await requireEmployerJob(session.user.id, id); const input = hiringSetupSchema.parse(await request.json()); return NextResponse.json(await saveHiringSetup(company.id, session.user.id, id, input)); } catch (error) { if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 }); return errorResponse(error); }
}
