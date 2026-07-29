"use client";

import { useRef, useState } from "react";
import { Bold, Eye, Italic, List, ListOrdered, Pencil } from "lucide-react";
import MarkdownContent from "@/components/ui/MarkdownContent";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  accent?: "teal" | "marigold";
};

function toolbarBtn(active?: boolean) {
  return `inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink ${
    active ? "bg-ink/8 text-ink" : ""
  }`;
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 8,
  accent = "teal",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const ringClass =
    accent === "marigold"
      ? "focus:border-marigold focus:ring-marigold/20"
      : "focus:border-teal focus:ring-teal/20";

  function insert(before: string, after = "", placeholderText = "") {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholderText;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertLine(prefix: string) {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);

    if (line.startsWith(prefix)) {
      onChange(value.slice(0, lineStart) + line.slice(prefix.length) + value.slice(end));
      return;
    }

    onChange(value.slice(0, lineStart) + prefix + line + value.slice(end));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 bg-mist/40 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          <button type="button" className={toolbarBtn()} onClick={() => insert("**", "**", "bold text")} title="Bold">
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className={toolbarBtn()} onClick={() => insert("*", "*", "italic text")} title="Italic">
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={toolbarBtn()}
            onClick={() => insertLine("- ")}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={toolbarBtn()}
            onClick={() => insertLine("1. ")}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={toolbarBtn()}
            onClick={() => insert("## ", "", "Section heading")}
            title="Heading"
          >
            <span className="text-xs font-bold">H</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
            preview ? "bg-ink text-mist" : "text-ink/55 hover:bg-ink/5"
          }`}
        >
          {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[120px] p-4">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm italic text-ink/40">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full resize-y border-0 bg-white px-4 py-4 text-sm leading-relaxed text-ink outline-none focus:ring-2 ${ringClass}`}
        />
      )}

      <p className="border-t border-ink/5 px-4 py-2 text-[11px] text-ink/40">
        Use **bold**, *italic*, - bullets, and ## headings. Preview before submitting.
      </p>
    </div>
  );
}
