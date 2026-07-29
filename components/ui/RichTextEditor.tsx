"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  Heading2,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  accent?: "teal" | "marigold";
};

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors ${
        active
          ? "bg-teal/15 text-teal"
          : "text-ink/55 hover:bg-ink/5 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 hidden h-6 w-px bg-ink/10 sm:block" aria-hidden="true" />;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Start typing…",
  minHeight = "220px",
  accent = "teal",
}: Props) {
  const lastEmitted = useRef(value);
  const accentRing =
    accent === "marigold"
      ? "focus-within:border-marigold focus-within:ring-marigold/20"
      : "focus-within:border-teal focus-within:ring-teal/20";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value || "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "tiptap-editor focus:outline-none",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = ed.getMarkdown();
      lastEmitted.current = md;
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      editor.commands.setContent(value || "", { contentType: "markdown" });
      lastEmitted.current = value;
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className="animate-pulse rounded-xl border border-ink/10 bg-mist/30"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-ink/10 bg-white focus-within:ring-2 ${accentRing}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/8 bg-mist/40 px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Section heading"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="px-4 py-4" />

      <p className="border-t border-ink/5 px-4 py-2 text-[11px] text-ink/40">
        Select text and use the toolbar — or use Ctrl+B / Ctrl+I. Formatting shows exactly as seekers will see it.
      </p>
    </div>
  );
}
