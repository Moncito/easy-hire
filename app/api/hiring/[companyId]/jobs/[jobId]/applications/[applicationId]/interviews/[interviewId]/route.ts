import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { cancelCollaborativeInterview } from "@/lib/collaborative-interviews";
export async function PATCH(r: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string; interviewId: string }> }) { try { const s=await auth(); if(!s?.user)return NextResponse.json({error:"Unauthorized"},{status:401}); const p=await params; return NextResponse.json(await cancelCollaborativeInterview(p.companyId,s.user.id,p.jobId,p.applicationId,p.interviewId)); } catch(e){return errorResponse(e);} }
