import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  formatLanguage,
  LANGUAGE_PRESETS,
  parseLanguage,
  PROFICIENCY_OPTIONS,
} from "@/lib/seeker/profile-format";
import { inputClassName, selectClassName, type UpdateField } from "./shared";

type Props = {
  languages: string[];
  onChange: UpdateField;
};

export default function LanguagesBucket({ languages, onChange }: Props) {
  const [langDraft, setLangDraft] = useState({ preset: "", custom: "", proficiency: "Fluent" });

  function addLanguage() {
    const language = (langDraft.preset || langDraft.custom.trim()).trim();
    if (!language) {
      toast.error("Select or type a language first");
      return;
    }
    const encoded = formatLanguage({ language, proficiency: langDraft.proficiency });
    const duplicate = languages.some(
      (l) => parseLanguage(l).language.toLowerCase() === language.toLowerCase()
    );
    if (duplicate) {
      toast.error("That language is already on your profile");
      return;
    }
    onChange("languages", [...languages, encoded]);
    setLangDraft({ preset: "", custom: "", proficiency: "Fluent" });
  }

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

      {languages.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {languages.map((lang) => {
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
                  onClick={() => onChange("languages", languages.filter((x) => x !== lang))}
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
}
