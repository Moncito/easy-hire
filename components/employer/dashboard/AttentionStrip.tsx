import Link from "next/link";
import { ChevronRight, AlertCircle, MessageSquare, Eye, Building2 } from "lucide-react";
import type { AttentionItem } from "@/lib/employer-analytics";

const iconMap: Record<string, typeof AlertCircle> = {
  "needs-review": AlertCircle,
  "unread-messages": MessageSquare,
  "no-views": Eye,
  profile: Building2,
};

type Props = {
  items: AttentionItem[];
  fallbackItems?: AttentionItem[];
};

export default function AttentionStrip({ items, fallbackItems = [] }: Props) {
  const visibleItems = items.length > 0 ? items : fallbackItems;
  if (visibleItems.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {visibleItems.map((item) => {
        const Icon = iconMap[item.id] ?? AlertCircle;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`group flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:shadow-sm ${
              item.priority === "high"
                ? "border-teal/20 bg-teal/5 text-ink hover:border-teal/30 hover:bg-teal/8"
                : "border-ink/8 bg-white text-ink/70 hover:border-ink/12 hover:bg-ink/[0.02]"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${item.priority === "high" ? "text-teal" : "text-ink/40"}`}
              strokeWidth={2}
            />
            <span>{item.label}</span>
            <ChevronRight className="h-3.5 w-3.5 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-teal" />
          </Link>
        );
      })}
    </div>
  );
}
