"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Globe,
  Share2,
} from "lucide-react";
import ProfileStrengthCard from "@/components/employer/ProfileStrengthCard";
import PublicCompanyPreview from "@/components/employer/PublicCompanyPreview";
import StickySaveBar from "@/components/employer/StickySaveBar";
import EmployerFormSection from "@/components/employer/ui/EmployerFormSection";
import VerificationDocumentsPanel, {
  type VerificationDoc,
} from "@/components/employer/VerificationDocumentsPanel";

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
  };
  verificationDocuments?: VerificationDoc[];
};

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

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
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

function BehanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 7h-7V5h7v2zm1.726 10c-.442 2.333-2.23 3.995-4.726 3.995H0V4h15.104c2.482 0 4.302 1.435 4.726 3.995h-7.008c-.442 1.169-.988 2.005-1.638 2.508-.65.503-1.495.755-2.535.755-1.495 0-2.535-.503-3.12-1.51-.585-1.006-.878-2.412-.878-4.218 0-1.806.293-3.212.878-4.218.585-1.006 1.625-1.51 3.12-1.51 1.04 0 1.885.252 2.535.755.65.503 1.196 1.339 1.638 2.508H24c-.424-2.56-2.244-3.995-4.726-3.995H0v16h18c2.496 0 4.284-1.662 4.726-3.995h-7.008z" />
    </svg>
  );
}

function DribbbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115-7.808c-.153-.032-3.755-.753-6.244 1.493 2.192 2.027 5.127 3.025 6.242 3.375 1.115-.35 4.05-1.348 6.242-3.375-2.489-2.246-6.091-1.525-6.24-1.493zM2.988 13.622c.057.322.75 4.018 3.014 6.548 2.264-2.53 2.957-6.226 3.014-6.548-1.878-.58-3.14-1.58-3.014-6.548zm3.015 8.775c.257.872.565 1.688.922 2.442 1.872-1.006 3.36-2.548 4.35-4.334-1.34-1.025-2.828-1.92-4.272-2.108zm8.025-14.122c-.922-.257-1.84-.438-2.742-.558-1.115 1.348-2.535 3.375-3.375 5.127 2.489.35 4.978.153 6.117-.153zm-8.025 2.108c-1.444.188-2.932 1.083-4.272 2.108.99 1.786 2.478 3.328 4.35 4.334.357-.754.665-1.57.922-2.442z" />
    </svg>
  );
}

const inputClassName =
  "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20";

const chipClassName = (selected: boolean) =>
  `rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
    selected
      ? "scale-[1.02] border-teal bg-teal text-white shadow-xs"
      : "border-ink/10 text-ink/75 hover:border-teal/30 hover:bg-teal/5 hover:scale-[1.01]"
  }`;

export default function CompanyProfileEditor({
  initialData,
  stats,
  verificationDocuments = [],
}: Props) {
  const router = useRouter();
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

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/upload/banner", { method: "POST", body });
    const result = await res.json();
    setBannerUploading(false);

    if (!res.ok) {
      setError(result.error || "Banner upload failed");
      return;
    }

    setBannerUrl(result.bannerUrl);
    setSaved(false);
    router.refresh();
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    setError("");

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/upload/logo", { method: "POST", body });
    const result = await res.json();
    setLogoUploading(false);

    if (!res.ok) {
      setError(result.error || "Logo upload failed");
      return;
    }

    setLogoUrl(result.logoUrl);
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

    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const result = await res.json();
      setError(result.error || "Something went wrong");
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
      enabled: true,
    },
    {
      id: "facebook",
      label: "Facebook",
      value: form.facebookUrl,
      onChange: (value: string) => updateField("facebookUrl", value),
      placeholder: "https://facebook.com/...",
      icon: FacebookIcon,
      enabled: true,
    },
    {
      id: "instagram",
      label: "Instagram",
      value: form.instagramUrl,
      onChange: (value: string) => updateField("instagramUrl", value),
      placeholder: "https://instagram.com/...",
      icon: InstagramIcon,
      enabled: true,
    },
    {
      id: "x",
      label: "Twitter / X",
      value: form.xUrl,
      onChange: (value: string) => updateField("xUrl", value),
      placeholder: "https://x.com/...",
      icon: XIcon,
      enabled: true,
    },
    {
      id: "youtube",
      label: "YouTube",
      value: "",
      onChange: () => undefined,
      placeholder: "Coming soon",
      icon: YoutubeIcon,
      enabled: false,
    },
    {
      id: "github",
      label: "GitHub",
      value: "",
      onChange: () => undefined,
      placeholder: "Coming soon",
      icon: GithubIcon,
      enabled: false,
    },
    {
      id: "behance",
      label: "Behance",
      value: "",
      onChange: () => undefined,
      placeholder: "Coming soon",
      icon: BehanceIcon,
      enabled: false,
    },
    {
      id: "dribbble",
      label: "Dribbble",
      value: "",
      onChange: () => undefined,
      placeholder: "Coming soon",
      icon: DribbbleIcon,
      enabled: false,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <section className="mb-8 overflow-hidden rounded-2xl bg-ink/[0.02]">
        <div className="group relative h-28 w-full overflow-hidden sm:h-32">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-teal/40 via-navy/35 to-teal/30" />
          )}
          <div className="absolute inset-0 bg-ink/10 transition-opacity duration-300 group-hover:bg-ink/20" />
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
            className="absolute bottom-2 right-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white/25 group-hover:opacity-100 disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {bannerUploading ? "Uploading..." : bannerUrl ? "Change banner" : "Upload banner"}
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
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
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                    Verified
                  </span>
                )}
                {verificationStatus === "pending" && (
                  <span className="rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                    Pending review
                  </span>
                )}
                {verificationStatus === "rejected" && (
                  <span className="rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember">
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

          <div className="w-full min-w-[200px] sm:max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink/50">Profile strength</span>
              <span className="font-data font-bold text-teal">{profileStrength}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-ink/10"
              role="progressbar"
              aria-valuenow={profileStrength}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            >
              <div
                className="h-full rounded-full bg-teal transition-all duration-500 ease-out"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-ink/40">{strengthLabel}</p>
          </div>
        </div>
      </section>

      {error && !isDirty && (
        <div className="mb-6 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <EmployerFormSection title="Company information">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="companyName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Company Name <span className="text-ember">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className={inputClassName}
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
                    className={inputClassName}
                    placeholder="https://acme.co"
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45">Industry</p>
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField("industry", opt)}
                      className={chipClassName(form.industry === opt)}
                      aria-pressed={form.industry === opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="teamSize" className="mb-2 block text-xs font-medium text-ink/55">
                      Company Size
                    </label>
                    <select
                      id="teamSize"
                      value={form.teamSize}
                      onChange={(e) => updateField("teamSize", e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Select size</option>
                      {teamSizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                      className={inputClassName}
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
                      className={inputClassName}
                    />
                  </div>
                </div>
            </div>
          </EmployerFormSection>

          <EmployerFormSection
            title="About company"
            description="Tell candidates about your culture, mission, values, and what makes your company unique."
          >
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              rows={7}
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
                    className={chipClassName(selected)}
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
                    className={chipClassName(true)}
                    aria-pressed
                  >
                    {highlight}
                  </button>
                ))}
            </div>
          </EmployerFormSection>

          <EmployerFormSection title="Social presence" last>
            <div className="mb-2 flex items-center gap-2 text-ink/40">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Links shown on your public company page.</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {socialFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="mb-2 block text-xs font-semibold text-ink/55">
                      {field.label}
                      {!field.enabled && (
                        <span className="ml-2 rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                          Soon
                        </span>
                      )}
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
                        disabled={!field.enabled}
                        className={`${inputClassName} pl-10 disabled:cursor-not-allowed disabled:bg-ink/3 disabled:text-ink/35`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </EmployerFormSection>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <ProfileStrengthCard
            percentage={profileStrength}
            statusLabel={strengthLabel}
            checklist={checklist}
          />

          <PublicCompanyPreview
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
            verified={verificationStatus === "verified"}
          />

          {/* Company Statistics */}
          <section className="border-t border-ink/5 pt-6">
            <h3 className="mb-4 text-sm font-bold tracking-tight text-ink">Company statistics</h3>
            <dl className="space-y-4">
              {[
                { label: "Employees", value: form.teamSize || "—" },
                { label: "Active Jobs", value: stats.activeJobsCount.toString() },
                { label: "Applicants Received", value: stats.totalApplicantsCount.toString() },
                { label: "Average Response Time", value: "—" },
                { label: "Response Rate", value: "—" },
                { label: "Employer Rating", value: "Coming soon" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0 last:pb-0">
                  <dt className="text-xs font-medium text-ink/50">{stat.label}</dt>
                  <dd className="font-data text-sm font-semibold text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <VerificationDocumentsPanel
            status={verificationStatus}
            rejectionReason={initialData.verificationRejectionReason ?? null}
            initialDocuments={verificationDocuments}
          />
        </aside>
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
