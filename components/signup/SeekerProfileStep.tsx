"use client";

import { useState } from "react";
import { SeekerProfileData } from "./types";

const seekerSkills = ["Admin", "Social Media", "Customer Service", "Tech/IT", "Content Writing", "Bookkeeping", "Other"];
const availabilityOptions = ["Full-time", "Part-time", "Project-based"];
const experienceOptions = ["< 1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

type Props = {
  loading: boolean;
  onComplete: (data: SeekerProfileData) => void;
  onSkip: () => void;
};

export default function SeekerProfileStep({ loading, onComplete, onSkip }: Props) {
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  function toggleSkill(skill: string) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-black/5">
      <h1 className="mb-6 text-center font-display text-xl font-bold text-ink">
        Tell us about yourself
      </h1>

      <p className="mb-2 text-sm font-medium text-ink">What&apos;s your main VA skill?</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {seekerSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
              skills.includes(skill) ? "bg-ink text-mist border-ink" : "border-ink/20 text-ink"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium text-ink">Availability</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {availabilityOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setAvailability(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
              availability === opt ? "bg-ink text-mist border-ink" : "border-ink/20 text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium text-ink">Years of experience </p>
      <div className="mb-8 flex flex-wrap gap-2">
        {experienceOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setYearsExperience(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
              yearsExperience === opt ? "bg-ink text-mist border-ink" : "border-ink/20 text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onComplete({ skills, availability, yearsExperience })}
          disabled={loading}
          className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-mist disabled:opacity-60 cursor-pointer"
        >
          Complete sign-up
        </button>
        <button
          onClick={onSkip}
          disabled={loading}
          className="rounded-xl border border-ink/20 px-6 py-3 text-sm font-semibold text-ink/70 cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}