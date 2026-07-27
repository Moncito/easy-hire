"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, User } from "lucide-react";
import { formatPesoRange } from "@/lib/format";

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

type Props = {
  initialData: {
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
  };
};

const inputClassName =
  "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20";

export default function SeekerProfileEditor({ initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialData);
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError("");
  }

  function toggleSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    setSaved(false);
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
      setError(result.error || "Resume upload failed");
      return;
    }

    setResumeUrl(result.resumeUrl);
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

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
        desiredSalaryMin: form.desiredSalaryMin || null,
        desiredSalaryMax: form.desiredSalaryMax || null,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error || "Failed to save profile");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  const profileComplete = [
    form.fullName,
    form.headline,
    form.skills.length > 0,
    resumeUrl,
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-marigold/15 font-display text-xl font-bold text-marigold">
            <User className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-ink">{form.fullName || "Your profile"}</h2>
            <p className="mt-1 text-sm text-ink/55">
              {profileComplete}/4 essentials complete — employers see this when you apply.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
      )}
      {saved && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-teal">
          Profile saved successfully.
        </div>
      )}

      <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
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

      <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
        <h3 className="mb-2 text-base font-bold text-ink">Resume</h3>
        <p className="mb-4 text-sm text-ink/55">Required before you can apply to jobs. PDF or Word, max 5MB.</p>
        <div className="flex flex-wrap items-center gap-3">
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-mist px-4 py-2.5 text-sm font-medium text-ink hover:border-marigold/30"
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
            className="inline-flex items-center gap-2 rounded-xl bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-[#8a5a10] hover:bg-marigold/15 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading ? "Uploading..." : resumeUrl ? "Replace resume" : "Upload resume"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
        <h3 className="mb-5 text-base font-bold text-ink">Skills & availability</h3>
        <p className="mb-3 text-sm font-medium text-ink">Main VA skills</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {skillOptions.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                form.skills.includes(skill)
                  ? "border-ink bg-ink text-mist"
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
                  className={`rounded-full border px-4 py-2 text-sm ${
                    form.availability === opt ? "border-ink bg-ink text-mist" : "border-ink/20 text-ink"
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
                  className={`rounded-full border px-4 py-2 text-sm ${
                    form.yearsExperience === opt ? "border-ink bg-ink text-mist" : "border-ink/20 text-ink"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
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

      <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs">
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
  );
}
