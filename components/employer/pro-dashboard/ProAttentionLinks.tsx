import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AttentionItem } from "@/lib/employer-analytics";

type Props = {
  items: AttentionItem[];
};

/** Inline attention links for Pro — no pill cards. */
export default function ProAttentionLinks({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
      <span className="font-medium text-ink/45">Needs attention:</span>
      {items.map((item, i) => (
        <span key={item.id} className="inline-flex items-center">
          {i > 0 && <span className="mx-1 text-ink/25">·</span>}
          <Link
            href={item.href}
            className={`inline-flex items-center gap-0.5 font-semibold transition hover:underline ${
              item.priority === "high" ? "text-[#9A5B12]" : "text-ink/65"
            }`}
          >
            {item.label}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </span>
      ))}
    </div>
  );
}
