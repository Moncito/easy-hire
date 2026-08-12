"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, FileText, Plus, Upload, X } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import { updateSeekerProfile } from "@/lib/client/profile";
import { uploadPhoto, uploadResume } from "@/lib/client/uploads";
import SeekerEmployerPreview from "@/components/seeker/SeekerEmployerPreview";
import ProfileBucketNav from "@/components/seeker/ProfileBucketNav";
import {
  PROFILE_BUCKETS,
  hasSkill,
  profileBucketCompletion,
  type ProfileBucketId,
} from "@/components/seeker/profile-buckets";
import {
  formatCertification,
  formatEducation,
  formatLanguage,
  formatRelativeUpdated,
  formatResume,
  formatSkill,
  formatWorkExperience,
  isPdfResumeUrl,
  LANGUAGE_PRESETS,
  MAX_RESUMES,
  normalizeSkillEntry,
  parseEducation,
  parseLanguage,
  parseResume,
  parseSkill,
  parseWorkExperience,
  PROFICIENCY_OPTIONS,
  resumeFilenameFromUrl,
  SKILL_PRESETS,
  SKILL_PROFICIENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  VISIBILITY_OPTIONS,
  parseCertification,
  displayWorkExperience,
  displayEducation,
  displaySkill,
  skillName,
} from "@/lib/seeker-profile-format";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";
import Link from "next/link";

const availabilityOptions = ["Full-time", "Part-time", "Project-based"];
const experienceOptions = ["< 1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

type FormData = {
  fullName: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  resumeLabel: string;
  resumeUpdatedAt: string | null;
  resumes: string[];
  linkedinUrl: string;
  portfolioUrl: string;
  certifications: string[];
  languages: string[];
  workExperience: string[];
  education: string[];
  timezone: string;
  photoUrl: string | null;
  visibility: ProfileVisibilityLevel;
};

type Props = {
  initialData: FormData;
  profileUpdatedAt?: string;
  profileId?: string;
  initialBucket?: ProfileBucketId;
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

const inputClassName =
  "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20";

const selectClassName =
  "w-full cursor-pointer appearance-none rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20";

const summaryHeadlineClassName =
  "w-full border-b-2 border-ink/12 bg-transparent py-3 text-xl font-semibold text-ink placeholder:text-ink/25 outline-none transition-colors focus:border-marigold";

const summaryBioClassName =
  "w-full resize-y border-b border-ink/10 bg-transparent py-3 text-sm leading-relaxed text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-marigold/70";

async function parseJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function SeekerProfileEditor({
  initialData,
  profileUpdatedAt,
  profileId,
  initialBucket,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => normalizeFormData(initialData));
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl ?? null);
  const [resumeUpdatedAt, setResumeUpdatedAt] = useState(initialData.resumeUpdatedAt ?? null);
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl ?? null);
  const [certDraft, setCertDraft] = useState({ name: "", issuer: "", year: "" });
  const [workDraft, setWorkDraft] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [eduDraft, setEduDraft] = useState({ school: "", degree: "", field: "", year: "" });
  const [langDraft, setLangDraft] = useState({ preset: "", custom: "", proficiency: "Fluent" });
  const [customSkillDraft, setCustomSkillDraft] = useState("");
  const [skillProficiencyDraft, setSkillProficiencyDraft] = useState("Proficient");
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
  const { completed, total } = profileBucketCompletion(previewData);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => normalizeFormData({ ...prev, [key]: value }));
    setError("");
  }

  function toggleSkill(skill: string) {
    setForm((prev) => {
      const existing = prev.skills.find(
        (s) => skillName(s).toLowerCase() === skill.toLowerCase()
      );
      if (existing) {
        return normalizeFormData({
          ...prev,
          skills: prev.skills.filter((s) => s !== existing),
        });
      }
      return normalizeFormData({
        ...prev,
        skills: [...prev.skills, formatSkill({ skill, proficiency: "Proficient" })],
      });
    });
  }

  function addCertification() {
    const name = certDraft.name.trim();
    if (!name) return;
    const encoded = formatCertification({
      name,
      issuer: certDraft.issuer.trim(),
      year: certDraft.year.trim(),
    });
    if (form.certifications.includes(encoded)) {
      setCertDraft({ name: "", issuer: "", year: "" });
      return;
    }
    updateField("certifications", [...form.certifications, encoded]);
    setCertDraft({ name: "", issuer: "", year: "" });
  }

  function addWorkExperience() {
    const title = workDraft.title.trim();
    const company = workDraft.company.trim();
    if (!title || !company) return;
    const encoded = formatWorkExperience({
      title,
      company,
      startDate: workDraft.startDate.trim(),
      endDate: workDraft.endDate.trim(),
      description: workDraft.description.trim(),
    });
    updateField("workExperience", [...form.workExperience, encoded]);
    setWorkDraft({ title: "", company: "", startDate: "", endDate: "", description: "" });
  }

  function addEducation() {
    const school = eduDraft.school.trim();
    if (!school) return;
    const encoded = formatEducation({
      school,
      degree: eduDraft.degree.trim(),
      field: eduDraft.field.trim(),
      year: eduDraft.year.trim(),
    });
    updateField("education", [...form.education, encoded]);
    setEduDraft({ school: "", degree: "", field: "", year: "" });
  }

  function addLanguage() {
    const language = (langDraft.preset || langDraft.custom.trim()).trim();
    if (!language) {
      toast.error("Select or type a language first");
      return;
    }
    const encoded = formatLanguage({ language, proficiency: langDraft.proficiency });
    const duplicate = form.languages.some(
      (l) => parseLanguage(l).language.toLowerCase() === language.toLowerCase()
    );
    if (duplicate) {
      toast.error("That language is already on your profile");
      return;
    }
    updateField("languages", [...form.languages, encoded]);
    setLangDraft({ preset: "", custom: "", proficiency: "Fluent" });
  }

  function addCustomSkill() {
    const skill = customSkillDraft.trim();
    if (!skill) return;
    if (form.skills.some((s) => skillName(s).toLowerCase() === skill.toLowerCase())) {
      toast.error("That skill is already on your profile");
      setCustomSkillDraft("");
      return;
    }
    updateField("skills", [
      ...form.skills,
      formatSkill({ skill, proficiency: skillProficiencyDraft }),
    ]);
    setCustomSkillDraft("");
  }

  function removeSkill(raw: string) {
    updateField(
      "skills",
      form.skills.filter((s) => s !== raw)
    );
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
        return (
          <div className="grid gap-6">
            <div>
              <label htmlFor="headline" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Headline
              </label>
              <input
                id="headline"
                value={form.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="e.g. Executive VA · 5 yrs experience"
                className={summaryHeadlineClassName}
              />
            </div>
            <div>
              <label htmlFor="bio" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                About you
              </label>
              <textarea
                id="bio"
                rows={7}
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Brief summary of your experience and what you're looking for..."
                className={summaryBioClassName}
              />
            </div>
          </div>
        );

      case "basics":
        return (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Full name
              </label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Cebu, Philippines"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Phone
              </label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Photo</p>
              <p className="mb-3 text-sm text-ink/55">JPEG, PNG, or WebP. Max 2MB.</p>
              <div className="flex flex-wrap items-center gap-4">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-marigold/15 font-display text-xl font-bold text-marigold">
                    {(form.fullName?.[0] || "V").toUpperCase()}
                  </div>
                )}
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handlePhotoUpload(file);
                  }}
                />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => photoRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-[#8a5a10] hover:bg-marigold/15 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {photoUploading ? "Uploading..." : photoUrl ? "Replace photo" : "Upload photo"}
                </button>
              </div>
            </div>
          </div>
        );

      case "resume":
        return (
          <div className="space-y-6">
            <p className="text-sm text-ink/55">
              Store up to {MAX_RESUMES} resumes. Pick one as default for job applications.
            </p>

            {form.resumes.length > 0 ? (
              <ul className="space-y-4">
                {form.resumes.map((entry) => {
                  const parsed = parseResume(entry);
                  const isPrimary = parsed.url === resumeUrl;
                  return (
                    <li
                      key={entry}
                      className={`rounded-2xl border p-4 sm:p-5 ${
                        isPrimary ? "border-marigold/35 bg-marigold/5" : "border-ink/8 bg-mist/30"
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
                          {isPdfResumeUrl(parsed.url) ? (
                            <iframe
                              title={`Preview ${parsed.label}`}
                              src={`${parsed.url}#page=1&view=FitH&toolbar=0&navpanes=0`}
                              className="h-40 w-full"
                            />
                          ) : (
                            <div className="flex h-40 flex-col items-center justify-center gap-2 px-3 text-center">
                              <FileText className="h-8 w-8 text-marigold" aria-hidden="true" />
                              <p className="text-[11px] font-semibold text-ink/55">Word document</p>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-ink">{parsed.label || "Resume"}</p>
                              <p className="mt-1 font-data text-xs text-ink/45">
                                Updated {formatRelativeUpdated(parsed.updatedAt)}
                              </p>
                              {isPrimary && (
                                <span className="mt-2 inline-block rounded-full bg-marigold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                                  Default for applications
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeResume(entry)}
                              className="cursor-pointer rounded-lg p-1 text-ink/35 hover:bg-ink/5 hover:text-ember"
                              aria-label="Remove resume"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <a
                              href={parsed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-marigold/30"
                            >
                              Open
                            </a>
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryResume(entry)}
                                className="cursor-pointer rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-mist hover:bg-navy/90"
                              >
                                Set as default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/20 px-6 py-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-ink/25" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-ink/55">No resume uploaded yet</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleResumeUpload(file);
              }}
            />
            {form.resumes.length < MAX_RESUMES ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? "Uploading..." : form.resumes.length ? "Add another resume" : "Upload resume"}
              </button>
            ) : (
              <p className="text-sm text-ink/45">Maximum {MAX_RESUMES} resumes reached — remove one to add another.</p>
            )}
          </div>
        );

      case "skills":
        return (
          <div className="space-y-8">
            <div>
              <p className="mb-1 text-sm font-semibold text-ink">Popular VA skills</p>
              <p className="mb-4 text-sm text-ink/55">Tap to add at Proficient level — adjust below if needed.</p>
              <div className="flex flex-wrap gap-2.5">
                {SKILL_PRESETS.map((skill) => {
                  const active = hasSkill(previewData, skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "border-marigold bg-marigold text-ink shadow-sm"
                          : "border-ink/12 bg-mist/40 text-ink/70 hover:border-marigold/35 hover:bg-marigold/10"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-navy/8 bg-mist/30 p-5 lg:p-6">
              <p className="mb-1 text-sm font-semibold text-ink">Add a specific skill</p>
              <p className="mb-4 text-sm text-ink/55">
                Type specialty + proficiency — e.g. Shopify (Advanced), QuickBooks (Expert).
              </p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                <input
                  value={customSkillDraft}
                  onChange={(e) => setCustomSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  placeholder="e.g. Shopify, Canva, Medical billing…"
                  className={inputClassName}
                />
                <select
                  value={skillProficiencyDraft}
                  onChange={(e) => setSkillProficiencyDraft(e.target.value)}
                  className={selectClassName}
                >
                  {SKILL_PROFICIENCY_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-mist hover:bg-navy/90"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {form.skills.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-semibold text-ink">Your skills</p>
                <ul className="space-y-2">
                  {form.skills.map((raw) => {
                    const parsed = parseSkill(raw);
                    return (
                      <li
                        key={raw}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-white px-4 py-3"
                      >
                        <span className="text-sm font-medium text-ink">{displaySkill(raw)}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={parsed.proficiency}
                            onChange={(e) => {
                              const next = formatSkill({
                                skill: parsed.skill,
                                proficiency: e.target.value,
                              });
                              updateField(
                                "skills",
                                form.skills.map((s) => (s === raw ? next : s))
                              );
                            }}
                            className="cursor-pointer rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink"
                          >
                            {SKILL_PROFICIENCY_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeSkill(raw)}
                            className="cursor-pointer rounded-lg p-1 text-ink/35 hover:text-ember"
                            aria-label={`Remove ${parsed.skill}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-semibold text-ink">Years of experience</p>
              <div className="flex flex-wrap gap-2.5">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField("yearsExperience", opt)}
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                      form.yearsExperience === opt
                        ? "border-ink bg-ink text-mist shadow-sm"
                        : "border-ink/12 bg-mist/40 text-ink/70 hover:border-ink/25"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "career":
        return (
          <div className="space-y-6">
            <p className="text-sm text-ink/55">
              Add roles in reverse chronological order — most recent first.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={workDraft.title}
                onChange={(e) => setWorkDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Job title"
                className={inputClassName}
              />
              <input
                value={workDraft.company}
                onChange={(e) => setWorkDraft((d) => ({ ...d, company: e.target.value }))}
                placeholder="Company / client"
                className={inputClassName}
              />
              <input
                value={workDraft.startDate}
                onChange={(e) => setWorkDraft((d) => ({ ...d, startDate: e.target.value }))}
                placeholder="Start (e.g. Jan 2022)"
                className={inputClassName}
              />
              <input
                value={workDraft.endDate}
                onChange={(e) => setWorkDraft((d) => ({ ...d, endDate: e.target.value }))}
                placeholder="End (e.g. Present)"
                className={inputClassName}
              />
            </div>
            <textarea
              value={workDraft.description}
              onChange={(e) => setWorkDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              placeholder="What you did — tools, outcomes, team size…"
              className={`${inputClassName} resize-y`}
            />
            <button
              type="button"
              onClick={addWorkExperience}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" />
              Add role
            </button>
            {form.workExperience.length > 0 ? (
              <ul className="space-y-3">
                {form.workExperience.map((entry) => {
                  const parsed = parseWorkExperience(entry);
                  return (
                    <li
                      key={entry}
                      className="rounded-xl border border-ink/8 bg-mist/60 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{displayWorkExperience(entry)}</p>
                          {parsed.description && (
                            <p className="mt-1 text-xs leading-relaxed text-ink/55">{parsed.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "workExperience",
                              form.workExperience.filter((x) => x !== entry)
                            )
                          }
                          className="cursor-pointer rounded-lg p-1 text-ink/35 hover:bg-ink/5 hover:text-ember"
                          aria-label="Remove role"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-ink/15 bg-mist/20 px-4 py-8 text-center text-sm text-ink/45">
                No roles added yet — even freelance VA work counts.
              </p>
            )}
          </div>
        );

      case "education":
        return (
          <div className="space-y-6">
            <p className="text-sm text-ink/55">School, degree, and year — optional but builds trust.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={eduDraft.school}
                onChange={(e) => setEduDraft((d) => ({ ...d, school: e.target.value }))}
                placeholder="School / university"
                className={inputClassName}
              />
              <input
                value={eduDraft.degree}
                onChange={(e) => setEduDraft((d) => ({ ...d, degree: e.target.value }))}
                placeholder="Degree (e.g. BS IT)"
                className={inputClassName}
              />
              <input
                value={eduDraft.field}
                onChange={(e) => setEduDraft((d) => ({ ...d, field: e.target.value }))}
                placeholder="Field of study (optional)"
                className={inputClassName}
              />
              <input
                value={eduDraft.year}
                onChange={(e) => setEduDraft((d) => ({ ...d, year: e.target.value }))}
                placeholder="Year graduated"
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" />
              Add education
            </button>
            {form.education.length > 0 ? (
              <ul className="space-y-2">
                {form.education.map((entry) => (
                  <li
                    key={entry}
                    className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist/60 px-3 py-2.5 text-sm text-ink"
                  >
                    <span>{displayEducation(entry)}</span>
                    <button
                      type="button"
                      onClick={() => updateField("education", form.education.filter((x) => x !== entry))}
                      className="cursor-pointer rounded-lg p-1 text-ink/35 hover:text-ember"
                      aria-label="Remove education"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-ink/15 bg-mist/20 px-4 py-8 text-center text-sm text-ink/45">
                No education added yet.
              </p>
            )}
          </div>
        );

      case "next-role":
        return (
          <div className="grid gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Availability</p>
              <div className="flex flex-wrap gap-2">
                {availabilityOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField("availability", opt)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                      form.availability === opt
                        ? "border-ink bg-ink text-mist"
                        : "border-ink/20 text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="timezone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Your timezone
              </label>
              <p className="mb-3 text-sm text-ink/55">
                Helps employers know when you&apos;re available for overlap hours.
              </p>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) => updateField("timezone", e.target.value)}
                className={inputClassName}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-ink">Desired salary (PHP/month)</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="salaryMin" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Minimum
                  </label>
                  <input
                    id="salaryMin"
                    type="number"
                    min={0}
                    value={form.desiredSalaryMin ?? ""}
                    onChange={(e) =>
                      updateField("desiredSalaryMin", e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="salaryMax" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Maximum
                  </label>
                  <input
                    id="salaryMax"
                    type="number"
                    min={0}
                    value={form.desiredSalaryMax ?? ""}
                    onChange={(e) =>
                      updateField("desiredSalaryMax", e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>
              {(form.desiredSalaryMin || form.desiredSalaryMax) && (
                <p className="mt-3 font-data text-sm text-ink/60">
                  {formatPesoRange(form.desiredSalaryMin, form.desiredSalaryMax)}
                </p>
              )}
            </div>
          </div>
        );

      case "languages":
        return (
          <div className="space-y-6">
            <p className="text-sm text-ink/55">
              Most VA roles need English — add every language you can work in, at the level employers can expect.
            </p>

            <div className="rounded-2xl border border-navy/8 bg-mist/30 p-5 lg:p-6">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <div className="lg:col-span-1">
                  <label htmlFor="langPreset" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Common languages
                  </label>
                  <select
                    id="langPreset"
                    value={langDraft.preset}
                    onChange={(e) =>
                      setLangDraft((d) => ({
                        ...d,
                        preset: e.target.value,
                        custom: e.target.value ? "" : d.custom,
                      }))
                    }
                    className={selectClassName}
                  >
                    <option value="">Select…</option>
                    {LANGUAGE_PRESETS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label htmlFor="langCustom" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Or type yours
                  </label>
                  <input
                    id="langCustom"
                    value={langDraft.custom}
                    onChange={(e) =>
                      setLangDraft((d) => ({
                        ...d,
                        custom: e.target.value,
                        preset: e.target.value ? "" : d.preset,
                      }))
                    }
                    placeholder="e.g. Bisaya, French, German…"
                    className={inputClassName}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label htmlFor="langProficiency" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                    Proficiency
                  </label>
                  <select
                    id="langProficiency"
                    value={langDraft.proficiency}
                    onChange={(e) => setLangDraft((d) => ({ ...d, proficiency: e.target.value }))}
                    className={selectClassName}
                  >
                    {PROFICIENCY_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end lg:col-span-1">
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-mist hover:bg-navy/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add language
                  </button>
                </div>
              </div>
            </div>

            {form.languages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {form.languages.map((lang) => {
                  const parsed = parseLanguage(lang);
                  return (
                    <div
                      key={lang}
                      className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 bg-white px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{parsed.language}</p>
                        <p className="text-xs text-ink/50">{parsed.proficiency}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "languages",
                            form.languages.filter((x) => x !== lang)
                          )
                        }
                        className="cursor-pointer rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink"
                        aria-label={`Remove ${parsed.language}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-ink/15 bg-mist/20 px-4 py-8 text-center text-sm text-ink/45">
                No languages added yet — start with English if you&apos;re comfortable working in it.
              </p>
            )}
          </div>
        );

      case "credentials":
        return (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="linkedinUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                  LinkedIn
                </label>
                <input
                  id="linkedinUrl"
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="portfolioUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                  Portfolio / website
                </label>
                <input
                  id="portfolioUrl"
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => updateField("portfolioUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputClassName}
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Certifications</p>
              <p className="mb-3 text-sm text-ink/55">Name, issuer, and year for each credential.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={certDraft.name}
                  onChange={(e) => setCertDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Certificate name"
                  className={inputClassName}
                />
                <input
                  value={certDraft.issuer}
                  onChange={(e) => setCertDraft((d) => ({ ...d, issuer: e.target.value }))}
                  placeholder="Issuer (optional)"
                  className={inputClassName}
                />
                <input
                  value={certDraft.year}
                  onChange={(e) => setCertDraft((d) => ({ ...d, year: e.target.value }))}
                  placeholder="Year (optional)"
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {form.certifications.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {form.certifications.map((c) => {
                    const parsed = parseCertification(c);
                    const label = [parsed.name, parsed.issuer, parsed.year].filter(Boolean).join(" · ");
                    return (
                      <li
                        key={c}
                        className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist/60 px-3 py-2 text-sm text-ink"
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "certifications",
                              form.certifications.filter((x) => x !== c)
                            )
                          }
                          className="cursor-pointer rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
                          aria-label={`Remove ${label}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );

      case "visibility":
        return (
          <div className="space-y-3">
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = form.visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField("visibility", opt.value)}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? "border-marigold/40 bg-marigold/8"
                      : "border-ink/10 bg-white hover:border-navy/20"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-marigold bg-marigold" : "border-ink/25 bg-white"
                    }`}
                  >
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                    <span className="mt-0.5 block text-sm text-ink/55">{opt.description}</span>
                  </span>
                </button>
              );
            })}
            {form.visibility === "PUBLIC" && profileId && (
              <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-ink/70">
                <p className="font-semibold text-ink">Public profile link</p>
                <p className="mt-1 text-xs text-ink/55">
                  Anyone with the link can view your public portfolio page.
                </p>
                <Link
                  href={`/seekers/${profileId}`}
                  target="_blank"
                  className="mt-2 inline-block cursor-pointer text-sm font-semibold text-teal hover:underline"
                >
                  View public page
                </Link>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Progress toolbar (replaces old "Profile hub" card) ── */}
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <p className="font-data text-xs font-bold uppercase tracking-widest text-marigold">
            {completed}/{total} sections complete
          </p>
          <div className="mt-2 h-[2px] w-48 overflow-hidden rounded-full bg-ink/8 sm:w-64">
            <div
              className="h-full rounded-full bg-marigold transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
          {profileUpdatedAt && (
            <p className="mt-1.5 text-[11px] text-ink/40">
              Saved {formatRelativeUpdated(profileUpdatedAt)}
            </p>
          )}
        </div>
        <button
          type="submit"
          form="seeker-profile-form"
          disabled={loading}
          className="cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90 disabled:opacity-60"
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(280px,340px)] xl:gap-6">
        <aside className="hidden animate-slide-in-left lg:block">
          <div className="sticky top-28 py-1">
            <ProfileBucketNav
              variant="sidebar"
              activeId={activeBucket}
              onSelect={setActiveBucket}
              data={previewData}
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

        <aside className="hidden animate-slide-in-right xl:block">
          <SeekerEmployerPreview data={previewData} profileId={profileId} />
        </aside>
      </div>
    </div>
  );
}
