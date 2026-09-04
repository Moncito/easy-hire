import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSeeker } from "@/lib/public-seekers";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker-profile-completion";
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

  const [reviewAggregate, reviewRows] = await Promise.all([
    getSeekerReviewAggregate(seeker.id),
    listPublishedReviewsForSeeker(seeker.id, reviewsPage),
  ]);
  const disputableReviewIds = session?.user
    ? await subjectReviewIdsForViewer(
        session.user.id,
        reviewRows.map((row) => row.id)
      )
    : [];
  const reviewsTotalPages = Math.max(1, Math.ceil(reviewAggregate.count / REVIEWS_PAGE_SIZE));

  let metaLabel: string | null = null;
  let profileCompleted = 0;
  let profileTotal = 0;

  if (isSeeker && session?.user) {
    const profile = await ensureSeekerProfile(session.user.id, {
      fullName: session.user.name ?? "",
    });
    const { completed, total } = getSeekerProfileCompletion(profile);
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
    <div
      className="animate-fade-in"
      style={{
        background: "#F5F4F0",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <PublicSeekerNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />

      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 1.5rem 4rem",
        }}
      >
        <Link
          href={backHref}
          className="cursor-pointer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "1.5rem 0",
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "#6F6E69",
            letterSpacing: "0.01em",
            textDecoration: "none",
          }}
        >
          ← {backLabel}
        </Link>

        <div
          style={{
            width: "100%",
            height: 192,
            borderRadius: "14px 14px 0 0",
            background: "linear-gradient(118deg, #20242B 0%, #1E3A5F 32%, #1F8073 68%, #F2A93B 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
              opacity: 0.28,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              right: -48,
              top: -96,
              borderRadius: "50%",
              background: "rgba(242, 169, 59, 0.32)",
              filter: "blur(42px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              left: "28%",
              bottom: -110,
              borderRadius: "50%",
              background: "rgba(31, 128, 115, 0.4)",
              filter: "blur(36px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.32)",
              borderRadius: 9999,
              padding: "5px 12px",
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
            }}
          >
            Public Profile
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem 1.25rem",
            paddingBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.125rem",
              minWidth: 0,
              flex: "1 1 280px",
            }}
          >
            {seeker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seeker.photoUrl}
                alt=""
                style={{
                  width: 96,
                  height: 96,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  border: "4px solid #FFFFFF",
                  objectFit: "cover",
                  flexShrink: 0,
                  marginTop: -48,
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  border: "4px solid #FFFFFF",
                  background: "#FBF3E0",
                  color: "#D4930A",
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: -48,
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                  letterSpacing: "-0.02em",
                }}
              >
                {initials}
              </div>
            )}
            <div style={{ paddingTop: 16, minWidth: 0 }}>
              <h1
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "#111110",
                  margin: "0 0 3px",
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  overflowWrap: "anywhere",
                }}
              >
                {seeker.fullName}
              </h1>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#6F6E69",
                  margin: 0,
                  letterSpacing: "0.01em",
                }}
              >
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
              className="talent-profile-cta cursor-pointer"
              style={{
                background: "#D4930A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "0.575rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                letterSpacing: "0.01em",
                boxShadow: "0 1px 4px rgba(212,147,10,0.3)",
                transition: "opacity 0.15s",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                marginTop: 16,
              }}
            >
              Browse jobs
            </Link>
          )}
        </div>

        <style>{`
          .talent-profile-cta:hover { opacity: 0.88; }
          .talent-profile-cta:focus-visible {
            outline: 2px solid #D4930A;
            outline-offset: 2px;
          }
        `}</style>

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
