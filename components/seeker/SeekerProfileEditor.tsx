"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { updateSeekerProfile } from "@/lib/client/profile";
import { uploadPhoto, uploadResume } from "@/lib/client/uploads";
import SeekerEmployerPreview from "@/components/seeker/SeekerEmployerPreview";
import ProfileBucketNav from "@/components/seeker/ProfileBucketNav";
import { PROFILE_BUCKETS, type ProfileBucketId } from "@/components/seeker/profile-buckets";
import { formatRelativeUpdated, normalizeSkillEntry, parseResume } from "@/lib/seeker/profile-format";
import SummaryBucket from "@/components/seeker/profile-editor/SummaryBucket";
import BasicsBucket from "@/components/seeker/profile-editor/BasicsBucket";
import ResumeBucket from "@/components/seeker/profile-editor/ResumeBucket";
import SkillsBucket from "@/components/seeker/profile-editor/SkillsBucket";
import CareerBucket from "@/components/seeker/profile-editor/CareerBucket";
import EducationBucket from "@/components/seeker/profile-editor/EducationBucket";
import NextRoleBucket from "@/components/seeker/profile-editor/NextRoleBucket";
import LanguagesBucket from "@/components/seeker/profile-editor/LanguagesBucket";
import CredentialsBucket from "@/components/seeker/profile-editor/CredentialsBucket";
import VisibilityBucket from "@/components/seeker/profile-editor/VisibilityBucket";
import ProfileVisibilityCard from "@/components/seeker/profile-editor/ProfileVisibilityCard";
import ProfileQuickActionsCard from "@/components/seeker/profile-editor/ProfileQuickActionsCard";
import ProfileStandOutCard from "@/components/seeker/profile-editor/ProfileStandOutCard";
import { firstIncompleteBucket } from "@/lib/seeker/profile-completion";
import type { FormData } from "@/components/seeker/profile-editor/shared";

type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  initialData: FormData;
  profileUpdatedAt?: string;
  profileId?: string;
  initialBucket?: ProfileBucketId;
  idVerificationStatus?: IdVerificationStatus;
};

function isProfileBucketId(value: string): value is ProfileBucketId {
  return PROFILE_BUCKETS.some((b) => b.id === value);
}

function normalizeFormData(data: Partial<FormData>): FormData {
  return {
    fullName: data.fullName ?? "",
    phone: data.phone ?? "",
    location: data.location ?? "",
    headline: data.headline ?? "",
    bio: data.bio ?? "",
    skills: (data.skills ?? []).map(normalizeSkillEntry),
    availability: data.availability ?? null,
    yearsExperience: data.yearsExperience ?? null,
    desiredSalaryMin: data.desiredSalaryMin ?? null,
    desiredSalaryMax: data.desiredSalaryMax ?? null,
    resumeUrl: data.resumeUrl ?? null,
    resumeLabel: data.resumeLabel ?? "",
    resumeUpdatedAt: data.resumeUpdatedAt ?? null,
    resumes: data.resumes ?? [],
    linkedinUrl: data.linkedinUrl ?? "",
    portfolioUrl: data.portfolioUrl ?? "",
    certifications: data.certifications ?? [],
    languages: data.languages ?? [],
    workExperience: data.workExperience ?? [],
    education: data.education ?? [],
    timezone: data.timezone ?? "Asia/Manila",
    photoUrl: data.photoUrl ?? null,
    visibility: data.visibility ?? "STANDARD",
  };
}

export default function SeekerProfileEditor({
  initialData,
  profileUpdatedAt,
  profileId,
  initialBucket,
  idVerificationStatus = null,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => normalizeFormData(initialData));
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl ?? null);
  const [resumeUpdatedAt, setResumeUpdatedAt] = useState(initialData.resumeUpdatedAt ?? null);
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl ?? null);
  const [activeBucket, setActiveBucket] = useState<ProfileBucketId>(
    initialBucket && isProfileBucketId(initialBucket) ? initialBucket : "summary"
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");

  const previewData = {
    ...form,
    resumeUrl,
    photoUrl,
    workExperience: form.workExperience,
    education: form.education,
  };
  const activeMeta = PROFILE_BUCKETS.find((b) => b.id === activeBucket)!;
  // Computed client-side from live (possibly unsaved) form state, same as
  // the rest of this preview column — mirrors what page.tsx's server-side
  // firstIncompleteBucket() does for the dashboard's rail card, but reads
  // the seeker's in-progress edits instead of only the last-saved profile.
  const nextIncompleteBucket = firstIncompleteBucket(previewData);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => normalizeFormData({ ...prev, [key]: value }));
    setError("");
  }

  function setPrimaryResume(entry: string) {
    const parsed = parseResume(entry);
    setResumeUrl(parsed.url);
    setResumeUpdatedAt(parsed.updatedAt || null);
    updateField("resumeLabel", parsed.label);
  }

  function removeResume(entry: string) {
    const next = form.resumes.filter((r) => r !== entry);
    updateField("resumes", next);
    const parsed = parseResume(entry);
    if (parsed.url === resumeUrl) {
      const fallback = next[0];
      if (fallback) {
        setPrimaryResume(fallback);
      } else {
        setResumeUrl(null);
        setResumeUpdatedAt(null);
        updateField("resumeLabel", "");
      }
    }
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const result = await uploadResume(file);
      if (!result.ok) {
        const msg = result.data.error || "Resume upload failed";
        setError(msg);
        toast.error(msg);
        return;
      }
      setResumeUrl(result.data.resumeUrl ?? resumeUrl);
      const updatedAt = (result.data as { resumeUpdatedAt?: string | null }).resumeUpdatedAt;
      if (updatedAt) setResumeUpdatedAt(updatedAt);
      const newResumes = (result.data as { resumes?: string[] }).resumes;
      if (newResumes) updateField("resumes", newResumes);
      toast.success("Resume uploaded");
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true);
    setError("");
    try {
      const result = await uploadPhoto(file);
      if (!result.ok) {
        const msg = result.data.error || "Photo upload failed";
        setError(msg);
        toast.error(msg);
        return;
      }
      setPhotoUrl((result.data as { photoUrl?: string }).photoUrl ?? null);
      toast.success("Photo uploaded");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Full name is required");
      setActiveBucket("basics");
      return;
    }

    setLoading(true);

    try {
      const result = await updateSeekerProfile({
        fullName: form.fullName,
        phone: form.phone || null,
        location: form.location || null,
        headline: form.headline || null,
        bio: form.bio || null,
        skills: form.skills,
        availability: form.availability,
        yearsExperience: form.yearsExperience,
        desiredSalaryMin: form.desiredSalaryMin || null,
        desiredSalaryMax: form.desiredSalaryMax || null,
        resumeUrl,
        resumeLabel: form.resumeLabel || null,
        resumes: form.resumes,
        photoUrl,
        linkedinUrl: form.linkedinUrl || "",
        portfolioUrl: form.portfolioUrl || "",
        certifications: form.certifications,
        languages: form.languages,
        workExperience: form.workExperience,
        education: form.education,
        timezone: form.timezone,
        visibility: form.visibility,
      });

      if (!result.ok) {
        const msg = result.data.error || "Failed to save profile";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Profile saved");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function renderBucketContent() {
    switch (activeBucket) {
      case "summary":
        return <SummaryBucket headline={form.headline} bio={form.bio} onChange={updateField} />;

      case "basics":
        return (
          <BasicsBucket
            fullName={form.fullName}
            location={form.location}
            phone={form.phone}
            photoUrl={photoUrl}
            photoUploading={photoUploading}
            onChange={updateField}
            onPhotoUpload={handlePhotoUpload}
          />
        );

      case "resume":
        return (
          <ResumeBucket
            resumes={form.resumes}
            resumeUrl={resumeUrl}
            uploading={uploading}
            onUpload={handleResumeUpload}
            onSetPrimary={setPrimaryResume}
            onRemove={removeResume}
          />
        );

      case "skills":
        return (
          <SkillsBucket
            skills={form.skills}
            yearsExperience={form.yearsExperience}
            onChange={updateField}
          />
        );

      case "career":
        return <CareerBucket workExperience={form.workExperience} onChange={updateField} />;

      case "education":
        return <EducationBucket education={form.education} onChange={updateField} />;

      case "next-role":
        return (
          <NextRoleBucket
            availability={form.availability}
            timezone={form.timezone}
            desiredSalaryMin={form.desiredSalaryMin}
            desiredSalaryMax={form.desiredSalaryMax}
            onChange={updateField}
          />
        );

      case "languages":
        return <LanguagesBucket languages={form.languages} onChange={updateField} />;

      case "credentials":
        return (
          <CredentialsBucket
            linkedinUrl={form.linkedinUrl}
            portfolioUrl={form.portfolioUrl}
            certifications={form.certifications}
            onChange={updateField}
          />
        );

      case "visibility":
        return (
          <VisibilityBucket
            visibility={form.visibility}
            profileId={profileId}
            onChange={updateField}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Progress toolbar (replaces old "Profile hub" card) ──
          The N/total "sections complete" widget itself now lives solely in
          ProfileHeaderCard's strength ring, above this page — this toolbar
          keeps only the save-state text and the Save button so the fact
          isn't shown twice. Lightened (no card background, subtler shadow)
          so it sits well above the now-unboxed form. */}
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          {profileUpdatedAt && (
            <p className="text-xs text-ink/40">
              Saved {formatRelativeUpdated(profileUpdatedAt)}
            </p>
          )}
        </div>
        <button
          type="submit"
          form="seeker-profile-form"
          disabled={loading}
          className="cursor-pointer rounded-xl bg-marigold px-6 py-2.5 text-sm font-bold text-ink shadow-[0_6px_18px_-6px_rgba(242,169,59,0.55)] transition-colors hover:bg-marigold/90 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save profile"}
        </button>
      </div>

      <div className="lg:hidden">
        <ProfileBucketNav
          variant="pills"
          activeId={activeBucket}
          onSelect={setActiveBucket}
          data={previewData}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(300px,320px)] xl:gap-6">
        <aside className="hidden animate-slide-in-left lg:block">
          <div className="sticky top-28 py-1">
            <ProfileBucketNav
              variant="sidebar"
              activeId={activeBucket}
              onSelect={setActiveBucket}
              data={previewData}
              identityStatus={idVerificationStatus}
            />
          </div>
        </aside>

        <form id="seeker-profile-form" onSubmit={handleSubmit} className="min-w-0 space-y-4">
          {error && (
            <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
              {error}
            </div>
          )}

          <section key={activeBucket} className="animate-slide-up min-w-0">
            <div className="mb-1 h-0.5 w-10 rounded-full bg-marigold" />
            <div className="mb-6 mt-3">
              <h3 className="font-display text-xl font-bold text-ink">{activeMeta.label}</h3>
              <p className="mt-1.5 text-sm text-ink/55">{activeMeta.description}</p>
            </div>
            {renderBucketContent()}
          </section>

          <div className="flex flex-wrap gap-2">
            {(() => {
              const idx = PROFILE_BUCKETS.findIndex((b) => b.id === activeBucket);
              const prev = idx > 0 ? PROFILE_BUCKETS[idx - 1] : null;
              const next = idx < PROFILE_BUCKETS.length - 1 ? PROFILE_BUCKETS[idx + 1] : null;
              return (
                <>
                  {prev && (
                    <button
                      type="button"
                      onClick={() => setActiveBucket(prev.id)}
                      className="cursor-pointer rounded-xl border border-ink/10 px-4 py-2 text-sm font-medium text-ink/60 hover:border-navy/20"
                    >
                      ← {prev.label}
                    </button>
                  )}
                  {next && (
                    <button
                      type="button"
                      onClick={() => setActiveBucket(next.id)}
                      className="cursor-pointer rounded-xl border border-navy/15 bg-navy/5 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/10"
                    >
                      Next: {next.label} →
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          <div className="xl:hidden">
            <button
              type="button"
              onClick={() => setPreviewOpen((o) => !o)}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-navy/8 bg-white px-4 py-3 text-sm font-semibold text-ink"
            >
              Employer preview
              <ChevronDown
                className={`h-4 w-4 transition-transform ${previewOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {previewOpen && (
              <div className="mt-3">
                <SeekerEmployerPreview data={previewData} profileId={profileId} />
              </div>
            )}
          </div>
        </form>

        <aside className="hidden animate-slide-in-right space-y-4 xl:block">
          <SeekerEmployerPreview data={previewData} profileId={profileId} />
          <ProfileVisibilityCard visibility={form.visibility} onManage={() => setActiveBucket("visibility")} />
          <ProfileQuickActionsCard onSelectBucket={setActiveBucket} />
          {nextIncompleteBucket ? (
            <ProfileStandOutCard variant="finish" onAction={() => setActiveBucket(nextIncompleteBucket)} />
          ) : idVerificationStatus !== "APPROVED" ? (
            <ProfileStandOutCard
              variant="verify"
              onAction={() => router.push("/seeker/profile/identity")}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
