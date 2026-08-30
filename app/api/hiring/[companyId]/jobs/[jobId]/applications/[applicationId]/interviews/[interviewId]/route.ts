import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { cancelCollaborativeInterview, rescheduleInterview } from "@/lib/collaborative-interviews";
// A body with `scheduledAt` reschedules the interview in place (same id, so the
// candidate's calendar entry updates instead of duplicating); no body — the
// existing behaviour — cancels it. See lib/collaborative-interviews.ts.
export async function PATCH(r: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string; interviewId: string }> }) { try { const s=await auth(); if(!s?.user)return NextResponse.json({error:"Unauthorized"},{status:401}); const p=await params; const body = await r.json().catch(() => null); if (body && typeof body.scheduledAt === "string") { return NextResponse.json(await rescheduleInterview(p.companyId,s.user.id,p.jobId,p.applicationId,p.interviewId,{ scheduledAt: body.scheduledAt })); } return NextResponse.json(await cancelCollaborativeInterview(p.companyId,s.user.id,p.jobId,p.applicationId,p.interviewId)); } catch(e){return errorResponse(e);} }
