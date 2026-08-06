export type CandidateNote = {
  id: string;
  author: string;
  text: string;
  at: string;
};

const NOTES_PREFIX = "eh-notes:";

export function parseInternalNotes(raw: string | null | undefined): CandidateNote[] {
  if (!raw?.trim()) return [];

  if (raw.startsWith(NOTES_PREFIX)) {
    try {
      const parsed = JSON.parse(raw.slice(NOTES_PREFIX.length)) as CandidateNote[];
      if (Array.isArray(parsed)) return parsed.filter((n) => n.text?.trim());
    } catch {
      /* fall through to legacy */
    }
  }

  return [
    {
      id: "legacy",
      author: "Team",
      text: raw.trim(),
      at: "",
    },
  ];
}

export function serializeInternalNotes(notes: CandidateNote[]): string | null {
  if (notes.length === 0) return null;
  return `${NOTES_PREFIX}${JSON.stringify(notes)}`;
}

export function appendInternalNote(
  raw: string | null | undefined,
  author: string,
  text: string
): string {
  const trimmed = text.trim();
  if (!trimmed) return raw?.trim() || "";

  let existing: CandidateNote[] = [];
  if (raw?.startsWith(NOTES_PREFIX)) {
    existing = parseInternalNotes(raw);
  } else if (raw?.trim()) {
    existing = [{ id: "migrated-legacy", author: "Team", text: raw.trim(), at: "" }];
  }

  const next: CandidateNote[] = [
    {
      id: crypto.randomUUID(),
      author,
      text: trimmed,
      at: new Date().toISOString(),
    },
    ...existing,
  ];

  return serializeInternalNotes(next)!;
}

export function formatNoteTime(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
