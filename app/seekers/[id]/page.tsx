import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSeeker } from "@/lib/seeker/public-seekers";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker/profile-completion";
import PublicSeekerNavBand from "@/components/seekers/PublicSeekerNavBand";
import PublicSeekerProfileSections from "@/components/seekers/PublicSeekerProfileSections";
import {
  listPublishedReviewsForSeeker,
  getSeekerReviewAggregate,
  subjectReviewIdsForViewer,
  REVIEWS_PAGE_SIZE,
} from "@/lib/reviews";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import ReviewList from "@/components/reviews/ReviewList";
import VerificationBadge from "@/components/seeker/VerificationBadge";

// getPublicSeeker only resolves profiles with visibility: "PUBLIC" (see
// lib/seeker/public-seekers.ts) and throws otherwise. The catch block below
// must stay generic — it must not distinguish "no such id" from "profile
// exists but isn't public" in the returned metadata, or this page becomes an
// oracle for probing seeker ids/visibility.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const seeker = await getPublicSeeker(id);
    const description =
      seeker.bio?.slice(0, 160) ?? `${seeker.fullName}'s virtual assistant profile on EasyHire.`;
    return {
      title: `${seeker.fullName} — ${seeker.headline || "Virtual Assistant"}`,
      description,
      openGraph: {
        title: seeker.fullName,
        description,
        type: "profile",
      },
    };
  } catch {
    return { title: "Profile not found" };
  }
}

export default async function PublicSeekerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewsPage?: string }>;
}) {
  const { id } = await params;
  const { reviewsPage: reviewsPageParam } = await searchParams;
  const reviewsPage = Math.max(1, Number(reviewsPageParam) || 1);

  let seeker;
  try {
    seeker = await getPublicSeeker(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";
  const isEmployer = session?.user?.role === "EMPLOYER";

  // subjectReviewIdsForViewer genuinely needs the ids of the reviews just
  // fetched (it filters to that exact page of reviews), so it can't be a
  // sibling of listPublishedReviewsForSeeker in the Promise.all — it's
  // chained after it instead. That chain still runs concurrently with
  // getSeekerReviewAggregate and the self-view ensureSeekerProfile call
  // below (neither of which depends on it), so nothing here is more
  // sequential than it has to be.
  const [reviewAggregate, { reviewRows, disputableReviewIds }, ownProfile] = await Promise.all([
    getSeekerReviewAggregate(seeker.id),
    listPublishedReviewsForSeeker(seeker.id, reviewsPage).then(async (rows) => {
      const ids = session?.user
        ? await subjectReviewIdsForViewer(
            session.user.id,
            rows.map((row) => row.id)
          )
        : [];
      return { reviewRows: rows, disputableReviewIds: ids };
    }),
    isSeeker && session?.user
      ? ensureSeekerProfile(session.user.id, { fullName: session.user.name ?? "" })
      : Promise.resolve(null),
  ]);
  const reviewsTotalPages = Math.max(1, Math.ceil(reviewAggregate.count / REVIEWS_PAGE_SIZE));

  let metaLabel: string | null = null;
  let profileCompleted = 0;
  let profileTotal = 0;

  if (isSeeker && session?.user && ownProfile) {
    const { completed, total } = getSeekerProfileCompletion(ownProfile);
    profileCompleted = completed;
    profileTotal = total;
    const firstName = session.user.name?.trim().split(/\s+/)[0];
    if (firstName) metaLabel = `Hi, ${firstName}`;
  }

  const backHref = isEmployer ? "/employer/talent" : "/jobs";
  const backLabel = isEmployer ? "Back to talent search" : "Back to jobs";

  const initials = seeker.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in min-h-screen bg-mist">
      <PublicSeekerNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />

      <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent py-6 text-[0.85rem] font-medium tracking-[0.01em] text-ink/45 no-underline"
        >
          ← {backLabel}
        </Link>

        <div className="relative h-36 w-full overflow-hidden rounded-t-2xl bg-[linear-gradient(118deg,var(--color-ink)_0%,var(--color-navy)_32%,var(--color-teal)_68%,var(--color-marigold)_100%)] sm:h-48">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-marigold/30 blur-[42px] sm:h-72 sm:w-72" />
          <div className="absolute -bottom-24 left-[28%] h-48 w-48 rounded-full bg-teal/40 blur-[36px] sm:h-56 sm:w-56" />
          <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
            Public Profile
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div className="flex min-w-0 flex-1 basis-[280px] items-start gap-4">
            {seeker.photoUrl ? (
              <Image
                src={seeker.photoUrl}
                alt=""
                width={96}
                height={96}
                className="relative z-[1] -mt-10 box-border h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-[0_2px_10px_rgba(0,0,0,0.18)] sm:-mt-12 sm:h-24 sm:w-24"
              />
            ) : (
              <div className="relative z-[1] -mt-10 box-border flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-marigold/12 text-xl font-bold tracking-tight text-marigold shadow-[0_2px_10px_rgba(0,0,0,0.18)] sm:-mt-12 sm:h-24 sm:w-24 sm:text-[1.35rem]">
                {initials}
              </div>
            )}
            <div className="min-w-0 pt-4">
              <h1 className="font-display m-0 mb-0.5 text-xl font-bold leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:text-[1.45rem]">
                {seeker.fullName}
              </h1>
              <p className="m-0 text-sm font-medium tracking-[0.01em] text-ink/45">
                {seeker.headline || "Virtual Assistant"}
              </p>
              <div className="mt-2">
                <VerificationBadge
                  score={seeker.verificationScore}
                  tier={seeker.verificationTier}
                  idVerifiedAt={seeker.idVerifiedAt}
                  accent="seeker"
                />
              </div>
            </div>
          </div>

          {isSeeker && (
            <Link
              href="/jobs"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-marigold px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_4px_rgba(242,169,59,0.35)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold sm:w-auto"
            >
              Browse jobs
            </Link>
          )}
        </div>

        <PublicSeekerProfileSections
          seeker={{
            fullName: seeker.fullName,
            headline: seeker.headline,
            bio: seeker.bio,
            location: seeker.location,
            timezone: seeker.timezone,
            desiredSalaryMin: seeker.desiredSalaryMin,
            desiredSalaryMax: seeker.desiredSalaryMax,
            yearsExperience: seeker.yearsExperience,
            availability: seeker.availability,
            skills: seeker.skills,
            workExperience: seeker.workExperience,
            education: seeker.education,
            languages: seeker.languages,
            certifications: seeker.certifications,
            linkedinUrl: seeker.linkedinUrl,
            portfolioUrl: seeker.portfolioUrl,
            resumeUrl: seeker.resumeUrl,
            updatedAt: seeker.updatedAt,
          }}
        />

        <section id="reviews" className="border-t border-[#E4E2DC] pt-10 mt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Reviews</h2>
              <p className="mt-1 text-sm text-ink/45">
                From employers who&apos;ve actually hired this VA — unlocked only after a completed
                hire.
              </p>
            </div>
          </div>

          <ReviewSummary aggregate={reviewAggregate} subjectType="seeker" />

          <div className="mt-6">
            <ReviewList
              reviews={reviewRows}
              disputableReviewIds={disputableReviewIds}
              page={reviewsPage}
              totalPages={reviewsTotalPages}
              baseHref={`/seekers/${id}`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
