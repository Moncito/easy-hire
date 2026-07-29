import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/Auth";
import { ArrowLeft, Download } from "lucide-react";
import { getSeekerProfileForEmployer } from "@/lib/talent";
import { ApiError } from "@/lib/api-error";
import SeekerEmployerPreview from "@/components/seeker/SeekerEmployerPreview";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export default async function EmployerSeekerProfilePage({
  params,
}: {
  params: Promise<{ seekerId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const { seekerId } = await params;

  let data;
  try {
    data = await getSeekerProfileForEmployer(session.user.id, seekerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { profile, applications, saved, canDownloadResume } = data;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/employer/talent"
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink/55 hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to talent search
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/8 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {profile.fullName}
                </h1>
                <p className="mt-1 text-sm text-ink/50">{profile.headline || "Virtual Assistant"}</p>
              </div>
              <div className="flex gap-2">
                <MessageSeekerButton seekerId={profile.id} />
                <SaveSeekerButton seekerId={profile.id} saved={saved} />
                {canDownloadResume && profile.resumeUrl && (
                  <a
                    href={`/api/employer/talent/${profile.id}/resume`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink/10 px-3.5 py-2 text-xs font-semibold text-ink/70 hover:border-teal/30 hover:bg-teal/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download resume
                  </a>
                )}
              </div>
            </div>

            {profile.bio && <p className="mt-4 text-sm leading-relaxed text-ink/70">{profile.bio}</p>}
          </div>

          <div className="rounded-2xl border border-ink/8 bg-white p-6 shadow-xs">
            <h2 className="font-display text-base font-bold text-ink">
              Application history with your company
            </h2>
            {applications.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">
                This candidate hasn&apos;t applied to any of your jobs yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/5">
                {applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-medium text-ink">{a.job.title}</p>
                      <p className="text-xs text-ink/45">
                        Applied {new Date(a.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/65">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <SeekerEmployerPreview
            data={{
              fullName: profile.fullName,
              headline: profile.headline,
              location: profile.location,
              bio: profile.bio,
              skills: profile.skills,
              availability: profile.availability,
              yearsExperience: profile.yearsExperience,
              desiredSalaryMin: profile.desiredSalaryMin,
              desiredSalaryMax: profile.desiredSalaryMax,
              resumeUrl: profile.resumeUrl,
              linkedinUrl: profile.linkedinUrl,
              portfolioUrl: profile.portfolioUrl,
              certifications: profile.certifications,
              languages: profile.languages,
              workExperience: profile.workExperience,
              education: profile.education,
              timezone: profile.timezone,
              photoUrl: profile.photoUrl,
              visibility: profile.visibility,
            }}
          />
        </div>
      </div>
    </div>
  );
}

