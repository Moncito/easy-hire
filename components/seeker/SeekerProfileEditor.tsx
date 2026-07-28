"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Plus, Upload, X } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import SeekerEmployerPreview from "@/components/seeker/SeekerEmployerPreview";

const skillOptions = [
  "Admin",
  "Social Media",
  "Customer Service",
  "Tech/IT",
  "Content Writing",
  "Bookkeeping",
  "Other",
];

const availabilityOptions = ["Full-time", "Part-time", "Project-based"];
const experienceOptions = ["< 1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

type FormData = {
  fullName: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  certifications: string[];
  photoUrl: string | null;
  profileVisibility: boolean;
};

type Props = { initialData: FormData };

const inputClassName =
  "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20";

function completenessScore(form: FormData, resumeUrl: string | null, photoUrl: string | null) {
  const checks = [
    !!form.fullName.trim(),
    !!form.headline,
    form.skills.length > 0,
    !!resumeUrl,
    !!form.location,
    !!form.bio,
    !!form.linkedinUrl,
    !!photoUrl,
    form.certifications.length > 0,
    form.profileVisibility,
  ];
  return checks.filter(Boolean).length;
}

export default function SeekerProfileEditor({ initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialData);
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl);
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl);
  const [certDraft, setCertDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function toggleSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  function addCertification() {
    const value = certDraft.trim();
    if (!value) return;
    if (form.certifications.includes(value)) {
      setCertDraft("");
      return;
    }
    updateField("certifications", [...form.certifications, value]);
    setCertDraft("");
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload/resume", { method: "POST", body });
    const result = await res.json();
    setUploading(false);
    if (!res.ok) {
      const msg = result.error || "Resume upload failed";
      setError(msg);
      toast.error(msg);
      return;
    }
    setResumeUrl(result.resumeUrl);
    toast.success("Resume uploaded");
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload/photo", { method: "POST", body });
    const result = await res.json();
    setPhotoUploading(false);
    if (!res.ok) {
      const msg = result.error || "Photo upload failed";
      setError(msg);
      toast.error(msg);
      return;
    }
    setPhotoUrl(result.photoUrl);
    toast.success("Photo uploaded");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/profile/seeker", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        resumeUrl,
        photoUrl,
        linkedinUrl: form.linkedinUrl || "",
        portfolioUrl: form.portfolioUrl || "",
        desiredSalaryMin: form.desiredSalaryMin || null,
        desiredSalaryMax: form.desiredSalaryMax || null,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg = result.error || "Failed to save profile";
      setError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Profile saved");
    router.refresh();
  }

  const score = completenessScore(form, resumeUrl, photoUrl);
  const scoreTotal = 10;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-[0_8px_30px_rgba(30,58,95,0.04)] sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-marigold/15 font-display text-xl font-bold text-marigold">
                  {(form.fullName?.[0] || "V").toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-ink">
                {form.fullName || "Your profile"}
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                <span className="font-data font-semibold text-ink">{score}/{scoreTotal}</span> profile
                strength — photo + LinkedIn help you stand out.
              </p>
              <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-marigold transition-all duration-500"
                  style={{ width: `${(score / scoreTotal) * 100}%` }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-5 text-base font-bold text-ink">Basic information</h3>
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
              <label htmlFor="headline" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Headline
              </label>
              <input
                id="headline"
                value={form.headline || ""}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="e.g. Executive VA · 5 yrs experience"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                Location
              </label>
              <input
                id="location"
                value={form.location || ""}
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
                value={form.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-2 text-base font-bold text-ink">Photo</h3>
          <p className="mb-4 text-sm text-ink/55">JPEG, PNG, or WebP. Max 2MB.</p>
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
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-2 text-base font-bold text-ink">Resume</h3>
          <p className="mb-4 text-sm text-ink/55">Required before you can apply. PDF or Word, max 5MB.</p>
          <div className="flex flex-wrap items-center gap-3">
            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-mist px-4 py-2.5 text-sm font-medium text-ink hover:border-marigold/30"
              >
                <FileText className="h-4 w-4 text-marigold" aria-hidden="true" />
                View current resume
              </a>
            ) : (
              <span className="text-sm text-ink/45">No resume uploaded yet</span>
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
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-[#8a5a10] hover:bg-marigold/15 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploading ? "Uploading..." : resumeUrl ? "Replace resume" : "Upload resume"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-5 text-base font-bold text-ink">Skills & availability</h3>
          <p className="mb-3 text-sm font-medium text-ink">Main VA skills</p>
          <div className="mb-6 flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                  form.skills.includes(skill)
                    ? "border-marigold/40 bg-marigold/15 text-[#8a5a10]"
                    : "border-ink/20 text-ink hover:border-marigold/40"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
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
              <p className="mb-2 text-sm font-medium text-ink">Experience</p>
              <div className="flex flex-wrap gap-2">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateField("yearsExperience", opt)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                      form.yearsExperience === opt
                        ? "border-ink bg-ink text-mist"
                        : "border-ink/20 text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-5 text-base font-bold text-ink">Desired salary (PHP/month)</h3>
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
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-5 text-base font-bold text-ink">Links</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="linkedinUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
                LinkedIn
              </label>
              <input
                id="linkedinUrl"
                type="url"
                value={form.linkedinUrl || ""}
                onChange={(e) => updateField("linkedinUrl", e.target.value || null)}
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
                value={form.portfolioUrl || ""}
                onChange={(e) => updateField("portfolioUrl", e.target.value || null)}
                placeholder="https://..."
                className={inputClassName}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <h3 className="mb-2 text-base font-bold text-ink">Certifications</h3>
          <p className="mb-4 text-sm text-ink/55">Add credentials employers can scan quickly.</p>
          <div className="flex gap-2">
            <input
              value={certDraft}
              onChange={(e) => setCertDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCertification();
                }
              }}
              placeholder="e.g. Google Sheets Certificate"
              className={inputClassName}
            />
            <button
              type="button"
              onClick={addCertification}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {form.certifications.length > 0 && (
            <ul className="mt-4 space-y-2">
              {form.certifications.map((c) => (
                <li
                  key={c}
                  className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist/60 px-3 py-2 text-sm text-ink"
                >
                  <span>{c.includes("|") ? c.replace("|", " · ") : c}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "certifications",
                        form.certifications.filter((x) => x !== c)
                      )
                    }
                    className="cursor-pointer rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink">Talent search visibility</h3>
              <p className="mt-1 text-sm text-ink/55">
                When on, verified employers can find you in talent search.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.profileVisibility}
              onClick={() => updateField("profileVisibility", !form.profileVisibility)}
              className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
                form.profileVisibility ? "bg-marigold" : "bg-ink/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  form.profileVisibility ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6">
          <label htmlFor="bio" className="mb-2 block text-base font-bold text-ink">
            About you
          </label>
          <textarea
            id="bio"
            rows={5}
            value={form.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Brief summary of your experience and what you're looking for..."
            className={`${inputClassName} resize-y`}
          />
        </section>
      </form>

      <SeekerEmployerPreview
        data={{
          ...form,
          resumeUrl,
          photoUrl,
        }}
      />
    </div>
  );
}
