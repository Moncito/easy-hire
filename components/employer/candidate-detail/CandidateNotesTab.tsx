"use client";

import { parseInternalNotes, formatNoteTime, type CandidateNote } from "@/lib/candidate-notes";

type Props = {
  internalNotes: string | null;
  noteInput: string;
  savingNotes: boolean;
  onNoteChange: (value: string) => void;
  onSaveNotes: () => void;
};

export default function CandidateNotesTab({
  internalNotes,
  noteInput,
  savingNotes,
  onNoteChange,
  onSaveNotes,
}: Props) {
  const notes = parseInternalNotes(internalNotes);

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/45">Only visible to your team</p>
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/35">No notes yet. Add one below.</p>
        ) : (
          notes.map((note) => <NoteBubble key={note.id} note={note} />)
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={noteInput}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (noteInput.trim()) onSaveNotes();
            }
          }}
          placeholder="Add a note…"
          className="min-w-0 flex-1 rounded-xl border border-ink/8 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-teal/30 focus:ring-2 focus:ring-teal/10"
        />
        <button
          type="button"
          onClick={onSaveNotes}
          disabled={savingNotes || !noteInput.trim()}
          className="shrink-0 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy/90 disabled:opacity-40"
        >
          {savingNotes ? "…" : "Add"}
        </button>
      </div>
    </div>
  );
}

function NoteBubble({ note }: { note: CandidateNote }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/8 text-[10px] font-bold text-navy">
        {note.author.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-white px-3 py-2 ring-1 ring-ink/5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-ink">{note.author}</span>
          {note.at && <span className="text-[10px] text-ink/35">{formatNoteTime(note.at)}</span>}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink/75">{note.text}</p>
      </div>
    </div>
  );
}
