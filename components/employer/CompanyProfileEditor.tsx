"use client";

import { updateCompany } from "@/lib/client/company";
import { uploadBanner, uploadLogo } from "@/lib/client/uploads";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Globe,
  Share2,
  Sparkles,
} from "lucide-react";
import CompanyProfileTopBar from "@/components/employer/CompanyProfileTopBar";
import ProCompanyIdentityCard from "@/components/employer/pro-dashboard/ProCompanyIdentityCard";
import ProCompanyWorkspace from "@/components/employer/pro-dashboard/ProCompanyWorkspace";
import CompanyVerificationBanner from "@/components/employer/CompanyVerificationBanner";
import StickySaveBar from "@/components/employer/StickySaveBar";
import EmployerFormSection from "@/components/employer/ui/EmployerFormSection";
import EmployerFormSelect from "@/components/employer/ui/EmployerFormSelect";
import VerificationDocumentsPanel, {
  type VerificationDoc,
} from "@/components/employer/VerificationDocumentsPanel";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import ProBadge from "@/components/employer/pro/ProBadge";
import ResponseMetricsBadge from "@/components/companies/ResponseMetricsBadge";

const industryOptions = [
  "E-commerce",
  "Real Estate",
  "Healthcare",
  "Tech/SaaS",
  "Marketing",
  "Finance",
  "Other",
];

const highlightOptions = [
  "Remote Friendly",
  "Flexible Hours",
  "Health Insurance",
  "Paid Training",
  "Equipment Provided",
  "Performance Bonuses",
  "Career Growth",
  "Work-Life Balance",
  "International Clients",
];

const teamSizeOptions = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "200+", label: "200+ employees" },
];

type FormState = {
  companyName: string;
  description: string;
  website: string;
  industry: string;
  teamSize: string;
  foundedYear: string;
  headquarters: string;
  highlights: string[];
  linkedinUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
};

type Props = {
  companyId: string;
  initialData: {
    companyName: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    teamSize: string | null;
    foundedYear: number | null;
    headquarters: string | null;
    highlights: string[] | null;
    linkedinUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    xUrl: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    verificationStatus: "pending" | "verified" | "rejected" | null;
    verificationRejectionReason?: string | null;
  };
  stats: {
    activeJobsCount: number;
    totalApplicantsCount: number;
    responseRate: number | null;
    medianResponseMinutes: number | null;
    responseSampleSize: number | null;
    responseMetricsUpdatedAt: string | null;
  };
  verificationDocuments?: VerificationDoc[];
};

const lastUpdatedFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatLastUpdated(iso: string) {
  return lastUpdatedFormatter.format(new Date(iso));
}

function getProfileStrengthLabel(percentage: number) {
  if (percentage >= 75) return "Complete";
  if (percentage >= 50) return "Excellent";
  if (percentage >= 25) return "Good";
  return "Getting Started";
}

function buildChecklist(data: FormState & { logoUrl: string | null; bannerUrl: string | null }) {
  const hasSocial = !!(data.linkedinUrl || data.facebookUrl || data.instagramUrl || data.xUrl);

  return [
    { label: "Company Name", done: !!data.companyName },
    { label: "Website", done: !!data.website },
    { label: "Industry", done: !!data.industry },
    { label: "Company Description", done: !!data.description },
    { label: "Company Benefits", done: data.highlights.length > 0 },
    { label: "Company logo", done: !!data.logoUrl },
    { label: "Cover banner", done: !!data.bannerUrl },
    { label: "Headquarters", done: !!data.headquarters },
    { label: "Social Links", done: hasSocial },
  ];
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function inputClassName(isPro: boolean) {
  return isPro
    ? "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-ink/25 focus-visible:ring-2 focus-visible:ring-ink/10"
    : "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20";
}

function chipClassName(selected: boolean, isPro: boolean) {
  if (isPro) {
    return `rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 ${
      selected
        ? "border-ink bg-ink text-white"
        : "border-ink/10 text-ink/75 hover:border-ink/20 hover:bg-ink/[0.03]"
    }`;
  }
  return `rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
    selected
      ? "scale-[1.02] border-teal bg-teal text-white shadow-xs"
      : "border-ink/10 text-ink/75 hover:border-teal/30 hover:bg-teal/5 hover:scale-[1.01]"
  }`;
}

export default function CompanyProfileEditor({
  companyId,
  initialData,
  stats,
  verificationDocuments = [],
}: Props) {
  const router = useRouter();
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(initialData.bannerUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [form, setForm] = useState<FormState>({
    companyName: initialData.companyName,
    description: initialData.description || "",
    website: initialData.website || "",
    industry: initialData.industry || "",
    teamSize: initialData.teamSize || "",
    foundedYear: initialData.foundedYear?.toString() || "",
    headquarters: initialData.headquarters || "",
    highlights: initialData.highlights || [],
    linkedinUrl: initialData.linkedinUrl || "",
    facebookUrl: initialData.facebookUrl || "",
    instagramUrl: initialData.instagramUrl || "",
    xUrl: initialData.xUrl || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const verificationStatus = initialData.verificationStatus || "pending";
  const MAX_DESCRIPTION_LENGTH = 1000;

  const isDirty = useMemo(() => {
    return (
      form.companyName !== initialData.companyName ||
      form.description !== (initialData.description || "") ||
      form.website !== (initialData.website || "") ||
      form.industry !== (initialData.industry || "") ||
      form.teamSize !== (initialData.teamSize || "") ||
      form.foundedYear !== (initialData.foundedYear?.toString() || "") ||
      form.headquarters !== (initialData.headquarters || "") ||
      JSON.stringify(form.highlights) !== JSON.stringify(initialData.highlights || []) ||
      form.linkedinUrl !== (initialData.linkedinUrl || "") ||
      form.facebookUrl !== (initialData.facebookUrl || "") ||
      form.instagramUrl !== (initialData.instagramUrl || "") ||
      form.xUrl !== (initialData.xUrl || "")
    );
  }, [form, initialData]);

  const liveData = useMemo(
    () => ({ ...form, logoUrl, bannerUrl }),
    [form, logoUrl, bannerUrl]
  );

  const checklist = useMemo(() => buildChecklist(liveData), [liveData]);
  const profileStrength = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );
  const strengthLabel = getProfileStrengthLabel(profileStrength);

  const logoInitials = form.companyName
    ? form.companyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CO";

  async function handleRewriteAbout() {
    const result = await run<{ description: string; highlights: string[] }>("company-brand", {
      companyName: form.companyName || "This company",
      industry: form.industry || undefined,
      existingDescription: form.description || undefined,
      highlights: form.highlights.length > 0 ? form.highlights : undefined,
    });
    if (!result?.configured || !result.data) return;

    updateField("description", result.data.description.slice(0, MAX_DESCRIPTION_LENGTH));
    if (result.data.highlights.length > 0) {
      setForm((prev) => ({
        ...prev,
        highlights: Array.from(new Set([...prev.highlights, ...result.data!.highlights])),
      }));
      setSaved(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError("");
  }

  function toggleHighlight(highlight: string) {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.includes(highlight)
        ? prev.highlights.filter((h) => h !== highlight)
        : [...prev.highlights, highlight],
    }));
    setSaved(false);
    setError("");
  }

  function handleCancel() {
    setForm({
      companyName: initialData.companyName,
      description: initialData.description || "",
      website: initialData.website || "",
      industry: initialData.industry || "",
      teamSize: initialData.teamSize || "",
      foundedYear: initialData.foundedYear?.toString() || "",
      headquarters: initialData.headquarters || "",
      highlights: initialData.highlights || [],
      linkedinUrl: initialData.linkedinUrl || "",
      facebookUrl: initialData.facebookUrl || "",
      instagramUrl: initialData.instagramUrl || "",
      xUrl: initialData.xUrl || "",
    });
    setError("");
    setSaved(false);
  }

  async function handleBannerUpload(file: File) {
    setBannerUploading(true);
    setError("");

    const result = await uploadBanner(file);
    setBannerUploading(false);

    if (!result.ok) {
      setError(result.data.error || "Banner upload failed");
      return;
    }

    setBannerUrl(result.data.bannerUrl!);
    setSaved(false);
    router.refresh();
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    setError("");

    const result = await uploadLogo(file);
    setLogoUploading(false);

    if (!result.ok) {
      setError(result.data.error || "Logo upload failed");
      return;
    }

    setLogoUrl(result.data.logoUrl!);
    setSaved(false);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!form.companyName) {
      setError("Company name is required");
      return;
    }

    setLoading(true);

    const result = await updateCompany({
      companyName: form.companyName,
      description: form.description,
      website: form.website,
      industry: form.industry,
      teamSize: form.teamSize,
      foundedYear: form.foundedYear ? parseInt(form.foundedYear, 10) : null,
      headquarters: form.headquarters,
      highlights: form.highlights,
      linkedinUrl: form.linkedinUrl,
      facebookUrl: form.facebookUrl,
      instagramUrl: form.instagramUrl,
      xUrl: form.xUrl,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.data.error || "Something went wrong");
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  const socialFields = [
    {
      id: "linkedin",
      label: "LinkedIn",
      value: form.linkedinUrl,
      onChange: (value: string) => updateField("linkedinUrl", value),
      placeholder: "https://linkedin.com/company/...",
      icon: LinkedinIcon,
    },
    {
      id: "facebook",
      label: "Facebook",
      value: form.facebookUrl,
      onChange: (value: string) => updateField("facebookUrl", value),
      placeholder: "https://facebook.com/...",
      icon: FacebookIcon,
    },
    {
      id: "instagram",
      label: "Instagram",
      value: form.instagramUrl,
      onChange: (value: string) => updateField("instagramUrl", value),
      placeholder: "https://instagram.com/...",
      icon: InstagramIcon,
    },
    {
      id: "x",
      label: "Twitter / X",
      value: form.xUrl,
      onChange: (value: string) => updateField("xUrl", value),
      placeholder: "https://x.com/...",
      icon: XIcon,
    },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {isPro ? (
        <ProCompanyIdentityCard
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          logoInitials={logoInitials}
          companyName={form.companyName}
          industry={form.industry}
          website={form.website}
          verificationStatus={verificationStatus}
          bannerUploading={bannerUploading}
          logoUploading={logoUploading}
          bannerInputRef={bannerInputRef}
          logoInputRef={logoInputRef}
          onBannerChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleBannerUpload(file);
          }}
          onLogoChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleLogoUpload(file);
          }}
        />
      ) : (
      <section className="mb-5 overflow-hidden rounded-2xl border border-navy/[0.08] bg-white/90 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)]">
        <div className="group relative h-36 w-full overflow-hidden sm:h-44">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-teal/40 via-navy/35 to-teal/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-ink/5 to-transparent" />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleBannerUpload(file);
            }}
          />
          <button
            type="button"
            disabled={bannerUploading}
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-ink/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-ink/55 disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {bannerUploading ? "Uploading..." : bannerUrl ? "Change banner" : "Upload banner"}
          </button>
        </div>

        <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <div className="group/logo relative shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-16 w-16 rounded-xl border-2 border-white bg-teal object-cover shadow-sm transition-transform duration-300 group-hover/logo:scale-[1.02]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white bg-teal font-display text-xl font-bold text-white shadow-sm transition-transform duration-300 group-hover/logo:scale-[1.02]">
                  {logoInitials}
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoUpload(file);
                }}
              />
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal text-white shadow-sm hover:bg-teal/90 disabled:opacity-60"
                aria-label={logoUploading ? "Uploading logo" : "Upload company logo"}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl">
                  {form.companyName || "Your Company"}
                </h2>
                {verificationStatus === "verified" && (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-teal">
                    Verified
                  </span>
                )}
                {verificationStatus === "pending" && (
                  <span className="rounded-full bg-navy/8 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-navy">
                    Pending review
                  </span>
                )}
                {verificationStatus === "rejected" && (
                  <span className="rounded-full bg-ember/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ember">
                    Needs update
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
                <span>{form.industry || "Industry not set"}</span>
                {form.website && (
                  <>
                    <span className="text-ink/20" aria-hidden="true">
                      &bull;
                    </span>
                    <a
                      href={form.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      {form.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </>
                )}
              </p>
            </div>
        </div>
      </section>
      )}

      <CompanyVerificationBanner
        status={verificationStatus}
        rejectionReason={initialData.verificationRejectionReason}
      />

      {isPro ? (
        <ProCompanyWorkspace
          profileStrength={profileStrength}
          strengthLabel={strengthLabel}
          checklist={checklist}
        />
      ) : (
      <CompanyProfileTopBar
        logoInitials={logoInitials}
        logoUrl={logoUrl}
        bannerUrl={bannerUrl}
        companyName={form.companyName}
        industry={form.industry}
        description={form.description}
        highlights={form.highlights}
        headquarters={form.headquarters}
        teamSize={form.teamSize}
        website={form.website}
        activeJobsCount={stats.activeJobsCount}
        totalApplicantsCount={stats.totalApplicantsCount}
        verified={verificationStatus === "verified"}
        companyId={companyId}
        profileStrength={profileStrength}
        strengthLabel={strengthLabel}
        checklist={checklist}
      />
      )}

      {error && !isDirty && (
        <div className="mb-4 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
          {error}
        </div>
      )}

      <div className={isPro ? "space-y-8" : "space-y-5"}>
          {isPro ? (
            <div className="pro-card p-5 sm:p-6">
              <EmployerFormSection
                title="About company"
                description="Tell candidates about your culture, mission, values, and what makes your company unique."
                last
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-full border border-marigold/25 bg-marigold/10 px-3.5 py-2">
                  <div className="flex items-center gap-2 text-xs text-ink/65">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#9A5B12]" aria-hidden="true" />
                    <span>Let Easy AI draft or rewrite your About copy from what&apos;s here.</span>
                    <ProBadge size="sm" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRewriteAbout}
                    disabled={isLoading("company-brand")}
                    className="shrink-0 rounded-full bg-marigold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
                  >
                    {isLoading("company-brand")
                      ? "Writing…"
                      : form.description
                        ? "Rewrite About"
                        : "Draft with Easy AI"}
                  </button>
                </div>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  rows={6}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Share your story, team culture, and what makes working with you special..."
                  aria-describedby="description-counter"
                  className="w-full rounded-2xl border border-ink/10 bg-white p-5 text-sm leading-relaxed text-ink outline-none transition-colors focus-visible:border-ink/25 focus-visible:ring-2 focus-visible:ring-ink/10"
                />
                <div id="description-counter" className="mt-2 flex items-center justify-between font-data text-[11px] text-ink/40">
                  <span>Recommended: 150–300 characters</span>
                  <span aria-live="polite">
                    {form.description.length} / {MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </EmployerFormSection>
            </div>
          ) : null}

          <div>
          <EmployerFormSection title="Company information" last={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="companyName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Company Name <span className="text-ember">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className={inputClassName(isPro)}
                    placeholder="e.g. Acme Tech Inc."
                  />
                </div>
                <div>
                  <label htmlFor="website" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    className={inputClassName(isPro)}
                    placeholder="https://acme.co"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Industry</p>
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField("industry", opt)}
                      className={chipClassName(form.industry === opt, isPro)}
                      aria-pressed={form.industry === opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="teamSize" className="mb-1.5 block text-xs font-medium text-ink/55">
                      Company Size
                    </label>
                    <EmployerFormSelect
                      value={form.teamSize}
                      onChange={(value) => updateField("teamSize", value)}
                      options={teamSizeOptions}
                      placeholder="Select size"
                      ariaLabel="Company size"
                    />
                  </div>
                  <div>
                    <label htmlFor="foundedYear" className="mb-2 block text-xs font-medium text-ink/55">
                      Founded Year
                    </label>
                    <input
                      id="foundedYear"
                      type="number"
                      value={form.foundedYear}
                      onChange={(e) => updateField("foundedYear", e.target.value)}
                      placeholder="2020"
                      className={inputClassName(isPro)}
                    />
                  </div>
                  <div>
                    <label htmlFor="headquarters" className="mb-2 block text-xs font-medium text-ink/55">
                      Headquarters
                    </label>
                    <input
                      id="headquarters"
                      type="text"
                      value={form.headquarters}
                      onChange={(e) => updateField("headquarters", e.target.value)}
                      placeholder="San Francisco, CA"
                      className={inputClassName(isPro)}
                    />
                  </div>
                </div>
            </div>
          </EmployerFormSection>

          {!isPro && (
          <EmployerFormSection
            title="About company"
            description="Tell candidates about your culture, mission, values, and what makes your company unique."
          >
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              rows={6}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="Share your story, team culture, and what makes working with you special..."
              aria-describedby="description-counter"
              className="w-full rounded-2xl border border-ink/10 bg-white p-5 text-sm leading-relaxed text-ink outline-none transition-colors focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20"
            />
            <div id="description-counter" className="mt-2 flex items-center justify-between font-data text-[11px] text-ink/40">
              <span>Recommended: 150–300 characters</span>
              <span aria-live="polite">
                {form.description.length} / {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </EmployerFormSection>
          )}

          <EmployerFormSection
            title="Company highlights"
            description="Select benefits and perks that will appear on your public job postings."
          >
            <div className="flex flex-wrap gap-2">
              {highlightOptions.map((highlight) => {
                const selected = form.highlights.includes(highlight);
                return (
                  <button
                    key={highlight}
                    type="button"
                    onClick={() => toggleHighlight(highlight)}
                      className={chipClassName(selected, isPro)}
                    aria-pressed={selected}
                  >
                    {highlight}
                  </button>
                );
              })}
              {form.highlights
                .filter((h) => !highlightOptions.includes(h))
                .map((highlight) => (
                  <button
                    key={highlight}
                    type="button"
                    onClick={() => toggleHighlight(highlight)}
                    className={chipClassName(true, isPro)}
                    aria-pressed
                  >
                    {highlight}
                  </button>
                ))}
            </div>
          </EmployerFormSection>

          <EmployerFormSection title="Social presence">
            <div className="mb-3 flex items-center gap-2 text-ink/40">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Links shown on your public company page.</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {socialFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="mb-1.5 block text-xs font-semibold text-ink/55">
                      {field.label}
                    </label>
                    <div className="relative">
                      <Icon
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
                        aria-hidden="true"
                      />
                      <input
                        id={field.id}
                        type="url"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={`${inputClassName(isPro)} pl-10`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-ink/40">
              YouTube, GitHub, Behance, and Dribbble — more platforms coming soon.
            </p>
          </EmployerFormSection>

          <EmployerFormSection
            title="Response metrics"
            description="How quickly candidates hear back from you — computed automatically from your hiring activity, not editable here."
            last
          >
            <div className="rounded-2xl border border-teal/15 bg-teal/5 px-5 py-4">
              <ResponseMetricsBadge
                responseRate={stats.responseRate}
                medianResponseMinutes={stats.medianResponseMinutes}
                responseSampleSize={stats.responseSampleSize}
              />
              {stats.responseMetricsUpdatedAt && (
                <p className="mt-3 font-data text-[11px] text-ink/35">
                  Last updated {formatLastUpdated(stats.responseMetricsUpdatedAt)}
                </p>
              )}
            </div>
          </EmployerFormSection>
          </div>

          <div id="verification" className={isPro ? "pro-card p-5 sm:p-6" : undefined}>
          <EmployerFormSection title="Verification" last>
            <VerificationDocumentsPanel
              embedded
              status={verificationStatus}
              rejectionReason={initialData.verificationRejectionReason ?? null}
              initialDocuments={verificationDocuments}
            />
          </EmployerFormSection>
          </div>
      </div>

      <StickySaveBar
        visible={isDirty}
        loading={loading}
        saved={saved}
        error={error}
        onCancel={handleCancel}
      />
    </form>
  );
}
