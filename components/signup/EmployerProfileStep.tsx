"use client";

import { useState } from "react";
import { EmployerProfileData } from "./types";

const industryOptions = ["E-commerce", "Real Estate", "Healthcare", "Tech/SaaS", "Marketing", "Finance", "Other"];
const teamSizeOptions = ["Just me", "2-10", "11-50", "50+"];

type Props = {
  loading: boolean;
  onComplete: (data: EmployerProfileData) => void;
  onSkip: () => void;
};

export default function EmployerProfileStep({ loading, onComplete, onSkip }: Props) {
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");

  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-black/5">
      <h1 className="mb-6 text-center font-display text-xl font-bold text-ink">
        Tell us about your company
      </h1>

      <p className="mb-2 text-sm font-medium text-ink">Industry</p>
      <div className="mb-6 flex flex-wrap gap-2 ">
        {industryOptions.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => setIndustry(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
              industry === opt ? "bg-ink text-mist border-ink" : "border-ink/20 text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-medium text-ink">Team size</p>
      <div className="mb-8 flex flex-wrap gap-2">
        {teamSizeOptions.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => setTeamSize(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
              teamSize === opt ? "bg-ink text-mist border-ink" : "border-ink/20 text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onComplete({ industry, teamSize })}
          disabled={loading}
          className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-mist disabled:opacity-60 cursor-pointer"
        >
          Complete sign-up
        </button>
        <button
          type="button"
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