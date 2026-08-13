"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
};

export default function ActiveJobsRail({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = ref.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction: -1 | 1) => {
    ref.current?.scrollBy({ left: direction * 336, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <>
          <div className="employer-ws-rail-fade-left pointer-events-none absolute left-0 top-0 z-[1] h-full w-10" />
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll jobs left"
            className="employer-ws-rail-nav-btn absolute left-1 top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition hover:text-teal"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {canScrollRight && (
        <>
          <div className="employer-ws-rail-fade-right pointer-events-none absolute right-0 top-0 z-[1] h-full w-10" />
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll jobs right"
            className="employer-ws-rail-nav-btn absolute right-1 top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition hover:text-teal"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <div
        ref={ref}
        className="employer-jobs-scroll employer-jobs-scroll-hidden flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
      >
        {children}
      </div>
    </div>
  );
}
