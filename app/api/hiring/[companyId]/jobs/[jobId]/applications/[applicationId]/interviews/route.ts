import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { listInterviews, scheduleInterview } from "@/lib/collaborative-interviews";
export async function GET(_: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) { try { const s=await auth(); if(!s?.user)return NextResponse.json({error:"Unauthorized"},{status:401}); const p=await params; return NextResponse.json(await listInterviews(p.companyId,s.user.id,p.jobId,p.applicationId)); } catch(e){return errorResponse(e);} }
export async function POST(r: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) { try { const s=await auth(); if(!s?.user)return NextResponse.json({error:"Unauthorized"},{status:401}); const p=await params; return NextResponse.json(await scheduleInterview(p.companyId,s.user.id,p.jobId,p.applicationId,await parseJsonBody(r) as { scheduledAt: string; durationMins: number; format: string; location?: string; memberIds: string[] })); } catch(e){return errorResponse(e);} }
