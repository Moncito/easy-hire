"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

type TocItem = { id: string; title: string };

function useActiveSection(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-112px 0px -60% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return active;
}

function TocLinks({ items, active }: { items: TocItem[]; active: string | null }) {
  return (
    <ol className="space-y-0.5">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`block rounded-lg border-l-2 px-3 py-1.5 text-sm leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                isActive
                  ? "border-navy bg-navy/5 font-semibold text-navy"
                  : "border-transparent text-ink/60 hover:bg-navy/5 hover:text-ink"
              }`}
            >
              {item.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default function LegalToc({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items);

  return (
    <>
      {/* Below lg: collapsible */}
      <details className="group mb-8 rounded-2xl border border-ink/10 bg-white lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-2 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDown
            className="h-4 w-4 text-ink/50 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav aria-label="On this page" className="border-t border-ink/10 p-2">
          <TocLinks items={items} active={active} />
        </nav>
      </details>

      {/* lg+: sticky sidebar */}
      <aside className="hidden lg:block">
        <nav aria-label="On this page" className="sticky top-28">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink/45">
            On this page
          </p>
          <TocLinks items={items} active={active} />
        </nav>
      </aside>
    </>
  );
}
