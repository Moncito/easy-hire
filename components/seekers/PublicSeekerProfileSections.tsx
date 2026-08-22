"use client";

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  GraduationCap,
  Languages as LanguagesIcon,
  Link2,
  Sparkles,
  User,
} from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import {
  formatRelativeUpdated,
  parseCertification,
  parseEducation,
  parseLanguage,
  parseSkill,
  parseWorkExperience,
  timezoneLabel,
} from "@/lib/seeker-profile-format";
import CopyProfileLinkButton from "@/components/seekers/CopyProfileLinkButton";

export type PublicSeekerData = {
  fullName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  yearsExperience: string | null;
  availability: string | null;
  skills: string[];
  workExperience: string[];
  education: string[];
  languages: string[];
  certifications: string[];
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  updatedAt: Date;
};

type Fact = {
  label: string;
  value: string;
  sub: string;
  mono?: boolean;
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, "");
  } catch {
    return "Certificate";
  }
}

function certificationCard(raw: string): {
  name: string;
  issuer: string;
  year: string;
  href: string | null;
} {
  const parsed = parseCertification(raw);
  const href = [parsed.name, parsed.issuer].find(isHttpUrl)?.trim() ?? null;
  const nameIsUrl = isHttpUrl(parsed.name);
  const issuerIsUrl = isHttpUrl(parsed.issuer);

  const name = nameIsUrl
    ? parsed.issuer && !issuerIsUrl
      ? parsed.issuer
      : hostnameFromUrl(parsed.name)
    : parsed.name || parsed.issuer || "Certificate";

  const issuer = issuerIsUrl || parsed.issuer === name ? "" : parsed.issuer;

  return { name, issuer, year: parsed.year, href };
}

function buildFacts(seeker: PublicSeekerData): Fact[] {
  const facts: Fact[] = [];

  if (seeker.location) {
    facts.push({
      label: "Location",
      value: seeker.location,
      sub: "Remote-ready",
    });
  }

  if (seeker.timezone) {
    facts.push({
      label: "Timezone",
      value: timezoneLabel(seeker.timezone),
      sub: "Overlap with employer hours",
    });
  }

  if (seeker.desiredSalaryMin || seeker.desiredSalaryMax) {
    facts.push({
      label: "Expected Pay",
      value: formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax),
      sub: "Monthly USD",
      mono: true,
    });
  }

  if (seeker.yearsExperience) {
    facts.push({
      label: "Experience",
      value: seeker.yearsExperience,
      sub: "Professional VA experience",
    });
  }

  if (seeker.availability) {
    facts.push({
      label: "Availability",
      value: seeker.availability,
      sub: "Ready to start",
    });
  }

  return facts;
}

function ProfileSection({
  label,
  subtitle,
  children,
  bare,
  icon: Icon,
}: {
  label: string;
  subtitle?: string;
  children: ReactNode;
  bare?: boolean;
  icon: LucideIcon;
}) {
  return (
    <section
      style={{
        padding: bare ? "0 0 1.5rem" : "1.5rem 0",
        borderTop: bare ? "none" : "1px solid #E4E2DC",
      }}
    >
      <div style={{ marginBottom: "1.125rem" }}>
        <h2
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#A8A49D",
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: "0 0 0.2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Icon style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden />
          {label}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: "0.82rem",
              color: "#A8A49D",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function ExperienceCard({ raw }: { raw: string }) {
  const { title, company, startDate, endDate, description } = parseWorkExperience(raw);
  const dateLabel = [startDate, endDate || (startDate ? "Present" : "")]
    .filter(Boolean)
    .join(" — ");

  return (
    <div
      className="talent-lift-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E2DC",
        borderRadius: 10,
        padding: "1.125rem 1.25rem",
        boxShadow: "0 1px 2px rgba(17, 17, 16, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: description ? "0.625rem" : 0,
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "#111110",
              margin: "0 0 3px",
              letterSpacing: "-0.01em",
            }}
          >
            {title || "Role"}
          </p>
          {company && (
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#6F6E69",
                margin: 0,
              }}
            >
              {company}
            </p>
          )}
        </div>
        {dateLabel && (
          <span
            style={{
              background: "#F5F4F0",
              border: "1px solid #E4E2DC",
              borderRadius: 6,
              padding: "0.2rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#A8A49D",
              whiteSpace: "nowrap",
            }}
          >
            {dateLabel}
          </span>
        )}
      </div>
      {description && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6F6E69",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function EducationCard({ raw }: { raw: string }) {
  const { school, degree, field, year } = parseEducation(raw);
  const degreeLine = [degree, field].filter(Boolean).join(", ");
  const title = degreeLine || school || raw;
  const organization = degreeLine ? school : "";

  return (
    <div
      className="talent-lift-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E2DC",
        borderRadius: 10,
        padding: "1.125rem 1.25rem",
        boxShadow: "0 1px 2px rgba(17, 17, 16, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "#111110",
              margin: "0 0 3px",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </p>
          {organization && (
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#6F6E69",
                margin: 0,
              }}
            >
              {organization}
            </p>
          )}
        </div>
        {year && (
          <span
            style={{
              background: "#F5F4F0",
              border: "1px solid #E4E2DC",
              borderRadius: 6,
              padding: "0.2rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#A8A49D",
              whiteSpace: "nowrap",
            }}
          >
            {year}
          </span>
        )}
      </div>
    </div>
  );
}

const certLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#FFFFFF",
  border: "1px solid #E4E2DC",
  borderRadius: 10,
  padding: "0.875rem 1.125rem",
  textDecoration: "none",
  transition: "border-color 0.15s",
  cursor: "pointer",
};

const docLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.375rem",
  background: "#FFFFFF",
  border: "1px solid #E4E2DC",
  borderRadius: 7,
  padding: "0.45rem 0.875rem",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#374140",
  textDecoration: "none",
  transition: "border-color 0.15s, color 0.15s",
};

function SidebarCard({
  label,
  children,
  icon: Icon,
}: {
  label: string;
  children: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E2DC",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(17, 17, 16, 0.04), 0 6px 18px rgba(17, 17, 16, 0.06)",
        padding: "1.25rem 1.375rem",
      }}
    >
      <h2
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#A8A49D",
          textTransform: "uppercase",
          letterSpacing: "1px",
          margin: "0 0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Icon style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden />
        {label}
      </h2>
      {children}
    </section>
  );
}

export default function PublicSeekerProfileSections({ seeker }: { seeker: PublicSeekerData }) {
  const facts = buildFacts(seeker);
  const about = seeker.bio?.trim() ?? "";
  const skills = seeker.skills.filter((s) => s.trim());
  const workExperience = seeker.workExperience.filter((e) => e.trim());
  const education = seeker.education.filter((e) => e.trim());
  const languages = seeker.languages.filter((e) => e.trim());
  const certifications = seeker.certifications.filter((e) => e.trim());
  const links = [
    seeker.resumeUrl ? { label: "View resume", url: seeker.resumeUrl } : null,
    seeker.linkedinUrl ? { label: "LinkedIn", url: seeker.linkedinUrl } : null,
    seeker.portfolioUrl ? { label: "Portfolio", url: seeker.portfolioUrl } : null,
  ].filter((link): link is { label: string; url: string } => Boolean(link));

  const hasSidebar =
    skills.length > 0 || languages.length > 0 || certifications.length > 0 || links.length > 0;

  const skillsBlock =
    skills.length > 0 ? (
      <SidebarCard label="Skills & Specializations" icon={Sparkles}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {skills.map((raw) => {
            const { skill, proficiency } = parseSkill(raw);
            return (
              <div
                key={raw}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  background: "#FBF3E0",
                  border: "1px solid #E8C97A",
                  borderRadius: 7,
                  padding: "0.375rem 0.875rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#7A4F0D",
                  letterSpacing: "0.01em",
                }}
              >
                {skill}
                {proficiency && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#B07D30",
                      paddingLeft: "0.375rem",
                      borderLeft: "1px solid #E8C97A",
                    }}
                  >
                    {proficiency}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </SidebarCard>
    ) : null;

  const languagesBlock =
    languages.length > 0 ? (
      <SidebarCard label="Languages" icon={LanguagesIcon}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {languages.map((raw) => {
            const { language, proficiency } = parseLanguage(raw);
            return (
              <div
                key={raw}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "#F5F4F0",
                  border: "1px solid #E4E2DC",
                  borderRadius: 7,
                  padding: "0.4rem 0.875rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#111110",
                  }}
                >
                  {language || raw}
                </span>
                {proficiency && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "#A8A49D",
                      paddingLeft: "0.5rem",
                      borderLeft: "1px solid #E4E2DC",
                    }}
                  >
                    {proficiency}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </SidebarCard>
    ) : null;

  const certificationsBlock =
    certifications.length > 0 ? (
      <SidebarCard label="Certifications" icon={Award}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {certifications.map((raw) => {
            const { name, issuer, year, href } = certificationCard(raw);
            const meta = [issuer, year].filter(Boolean).join(" · ");
            const inner = (
              <>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#111110",
                      margin: "0 0 2px",
                    }}
                  >
                    {name}
                  </p>
                  {meta && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#A8A49D",
                        margin: 0,
                      }}
                    >
                      {meta}
                    </p>
                  )}
                </div>
                {href && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#A8A49D",
                      flexShrink: 0,
                      marginLeft: "1rem",
                    }}
                  >
                    ↗
                  </span>
                )}
              </>
            );

            if (href) {
              return (
                <a
                  key={raw}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                  style={certLinkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#D4930A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E4E2DC";
                  }}
                >
                  {inner}
                </a>
              );
            }

            return (
              <div key={raw} style={{ ...certLinkStyle, cursor: "default" }}>
                {inner}
              </div>
            );
          })}
        </div>
      </SidebarCard>
    ) : null;

  const linksBlock =
    links.length > 0 ? (
      <SidebarCard label="Links & Documents" icon={Link2}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
              style={docLinkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#D4930A";
                e.currentTarget.style.color = "#D4930A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E4E2DC";
                e.currentTarget.style.color = "#374140";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </SidebarCard>
    ) : null;

  return (
    <div>
      <style>{`
        .talent-profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          padding-top: 1.5rem;
          align-items: start;
        }
        @media (min-width: 768px) {
          .talent-profile-grid {
            grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
            gap: 2rem;
          }
        }
        @media (min-width: 1024px) {
          .talent-profile-grid {
            grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          }
        }
        .talent-profile-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .talent-lift-card {
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .talent-lift-card:hover {
          border-color: #E8C97A;
          box-shadow: 0 4px 14px rgba(17, 17, 16, 0.08);
          transform: translateY(-1px);
        }
      `}</style>

      <CopyProfileLinkButton />

      {facts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            background: "#FFFFFF",
            border: "1px solid #E4E2DC",
            borderRadius: 12,
            boxShadow: "0 1px 2px rgba(17, 17, 16, 0.04), 0 6px 18px rgba(17, 17, 16, 0.06)",
            overflow: "hidden",
          }}
        >
          {facts.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: "1 1 130px",
                padding: "1.25rem 1rem",
                borderRight: i < facts.length - 1 ? "1px solid #E4E2DC" : "none",
              }}
            >
              <p
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#A8A49D",
                  textTransform: "uppercase",
                  letterSpacing: "0.9px",
                  margin: "0 0 0.375rem",
                }}
              >
                {stat.label}
              </p>
              <p
                className={stat.mono ? "font-data" : undefined}
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#111110",
                  margin: "0 0 0.2rem",
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: "0.74rem",
                  color: "#A8A49D",
                  fontWeight: 400,
                  margin: 0,
                }}
              >
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className={hasSidebar ? "talent-profile-grid" : undefined} style={hasSidebar ? undefined : { paddingTop: "1.5rem" }}>
        <div style={{ minWidth: 0 }}>
          <ProfileSection label="About" icon={User} bare>
            {about ? (
              <p
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.8,
                  color: "#374140",
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {about}
              </p>
            ) : (
              <div
                style={{
                  border: "1px dashed #E4E2DC",
                  borderRadius: 10,
                  padding: "1.5rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#A8A49D",
                    margin: "0 0 0.25rem",
                  }}
                >
                  No bio added yet.
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#C4BFB8",
                    margin: 0,
                  }}
                >
                  Profiles with a bio receive significantly more employer views.
                </p>
              </div>
            )}
          </ProfileSection>

          {workExperience.length > 0 && (
            <ProfileSection label="Experience" icon={Briefcase}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {workExperience.map((entry) => (
                  <ExperienceCard key={entry} raw={entry} />
                ))}
              </div>
            </ProfileSection>
          )}

          {education.length > 0 && (
            <ProfileSection label="Education" icon={GraduationCap}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {education.map((entry) => (
                  <EducationCard key={entry} raw={entry} />
                ))}
              </div>
            </ProfileSection>
          )}
        </div>

        {hasSidebar && (
          <aside className="talent-profile-sidebar" aria-label="Profile details">
            {skillsBlock}
            {languagesBlock}
            {certificationsBlock}
            {linksBlock}
          </aside>
        )}
      </div>

      <p
        style={{
          fontSize: "0.78rem",
          color: "#C4BFB8",
          fontWeight: 400,
          padding: "1.5rem 0 0",
          borderTop: "1px solid #E4E2DC",
          margin: 0,
        }}
      >
        Profile updated {formatRelativeUpdated(seeker.updatedAt)}
      </p>
    </div>
  );
}
