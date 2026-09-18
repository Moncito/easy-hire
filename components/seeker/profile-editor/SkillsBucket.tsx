import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  displaySkill,
  formatSkill,
  parseSkill,
  SKILL_PRESETS,
  SKILL_PROFICIENCY_OPTIONS,
  skillName,
} from "@/lib/seeker/profile-format";
import { inputClassName, selectClassName, experienceOptions, type UpdateField } from "./shared";

type Props = {
  skills: string[];
  yearsExperience: string | null;
  onChange: UpdateField;
};

export default function SkillsBucket({ skills, yearsExperience, onChange }: Props) {
  const [customSkillDraft, setCustomSkillDraft] = useState("");
  const [skillProficiencyDraft, setSkillProficiencyDraft] = useState("Proficient");

  function hasSkill(skill: string): boolean {
    return skills.some((s) => skillName(s).toLowerCase() === skill.toLowerCase());
  }

  function toggleSkill(skill: string) {
    const existing = skills.find((s) => skillName(s).toLowerCase() === skill.toLowerCase());
    if (existing) {
      onChange("skills", skills.filter((s) => s !== existing));
      return;
    }
    onChange("skills", [...skills, formatSkill({ skill, proficiency: "Proficient" })]);
  }

  function addCustomSkill() {
    const skill = customSkillDraft.trim();
    if (!skill) return;
    if (hasSkill(skill)) {
      toast.error("That skill is already on your profile");
      setCustomSkillDraft("");
      return;
    }
    onChange("skills", [...skills, formatSkill({ skill, proficiency: skillProficiencyDraft })]);
    setCustomSkillDraft("");
  }

  function removeSkill(raw: string) {
    onChange("skills", skills.filter((s) => s !== raw));
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-sm font-semibold text-ink">Popular VA skills</p>
        <p className="mb-4 text-sm text-ink/55">Tap to add at Proficient level — adjust below if needed.</p>
        <div className="flex flex-wrap gap-2.5">
          {SKILL_PRESETS.map((skill) => {
            const active = hasSkill(skill);
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
          <div>
            <label htmlFor="customSkillDraft" className="sr-only">
              Skill name
            </label>
            <input
              id="customSkillDraft"
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
          </div>
          <div>
            <label htmlFor="customSkillProficiency" className="sr-only">
              Skill proficiency level
            </label>
            <select
              id="customSkillProficiency"
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
          </div>
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

      {skills.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Your skills</p>
          <ul className="space-y-2">
            {skills.map((raw) => {
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
                        onChange(
                          "skills",
                          skills.map((s) => (s === raw ? next : s))
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
              onClick={() => onChange("yearsExperience", opt)}
              className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                yearsExperience === opt
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
}
