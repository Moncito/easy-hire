import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { getPublicCompany } from "@/lib/public-companies";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker-profile-completion";
import CompanyNavBand from "@/components/companies/CompanyNavBand";
import CompanyAboutSection from "@/components/companies/CompanyAboutSection";
import CompanyJobRow from "@/components/companies/CompanyJobRow";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getPublicCompany(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

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

  const initials = company.companyName
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
      <CompanyNavBand
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
          href="/jobs"
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
          ← Back to jobs
        </Link>

        <div
          style={{
            width: "100%",
            height: 192,
            borderRadius: "14px 14px 0 0",
            background: "#E4E2DC",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {company.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.bannerUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
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
            {company.verifiedStatus === "APPROVED" ? "Verified employer" : "Company profile"}
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
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
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
                  background: "#E8F4F2",
                  color: "#1F8073",
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
                {company.companyName}
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
                {company.industry || "Employer on EasyHire"}
              </p>
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
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
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
                marginTop: 16,
              }}
            >
              <Globe style={{ width: 16, height: 16 }} aria-hidden="true" />
              Website
            </a>
          )}
        </div>

        <div style={{ paddingTop: "0.25rem" }}>
          <CompanyAboutSection
            companyName={company.companyName}
            description={company.description}
            industry={company.industry}
            teamSize={company.teamSize}
            headquarters={company.headquarters}
            foundedYear={company.foundedYear}
            highlights={company.highlights}
            verifiedStatus={company.verifiedStatus}
            openRolesCount={company.jobs.length}
            website={company.website}
            linkedinUrl={company.linkedinUrl}
            facebookUrl={company.facebookUrl}
            instagramUrl={company.instagramUrl}
            xUrl={company.xUrl}
          />
        </div>

        <section className="border-t border-[#E4E2DC] pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Open roles
                <span className="ml-2 font-data text-base font-semibold text-ink/45">
                  ({company.jobs.length})
                </span>
              </h2>
              <p className="mt-1 text-sm text-ink/45">
                Direct applications — no middlemen, guaranteed USD pay ranges where listed.
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-sm font-semibold text-marigold hover:text-marigold/80"
            >
              Browse all jobs
            </Link>
          </div>

          {company.jobs.length === 0 ? (
            <p className="py-8 text-sm text-ink/50">
              No active listings right now. Save this employer or check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {company.jobs.map((job) => (
                <CompanyJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
