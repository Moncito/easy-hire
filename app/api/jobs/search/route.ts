import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { searchPublicJobs, listJobCategories } from "@/lib/public-jobs";
import { jobSearchSchema } from "@/lib/validations/job-search";
import { ZodError } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const input = jobSearchSchema.parse({
      q: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      industry: searchParams.get("industry") || undefined,
      location: searchParams.get("location") || undefined,
      employmentType: searchParams.get("employmentType") || undefined,
      remoteType: searchParams.get("remoteType") || undefined,
      salaryMin: searchParams.get("salaryMin") || undefined,
      salaryMax: searchParams.get("salaryMax") || undefined,
      salaryPeriod: searchParams.get("salaryPeriod") || undefined,
      postedWithin: searchParams.get("postedWithin") || undefined,
      sort: searchParams.get("sort") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const [result, categories] = await Promise.all([
      searchPublicJobs(input),
      listJobCategories(),
    ]);

    return NextResponse.json({ ...result, categories });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}
