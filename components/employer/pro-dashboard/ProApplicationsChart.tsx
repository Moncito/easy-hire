"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartDay } from "@/lib/employer/dashboard-pipeline";

const H = 220;
const PAD = { left: 26, right: 6, top: 8, bottom: 24 };

/** Smallest "nice" axis top at or above the data: 4, then even steps, so gridlines land on whole numbers. */
function axisMax(value: number): number {
  if (value <= 4) return 4;
  const step = value <= 10 ? 2 : value <= 50 ? 10 : 50;
  return Math.ceil(value / step) * step;
}

/**
 * Daily applications (ink) and moves to interview (marigold). The only
 * client piece of the dashboard: it measures its own width so bars stay
 * crisp at any size. Data is fetched and labelled on the server — labels
 * arrive pre-formatted, so there's no date formatting here to mismatch
 * between server and client.
 */
export default function ProApplicationsChart({ days }: { days: ChartDay[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const total = days.reduce((sum, d) => sum + d.applications + d.interviews, 0);
  const max = axisMax(Math.max(0, ...days.map((d) => Math.max(d.applications, d.interviews))));
  const plotH = H - PAD.top - PAD.bottom;
  const colW = (width - PAD.left - PAD.right) / days.length;
  const barW = Math.max(2, Math.min(14, colW * 0.32));
  const scale = plotH / max;
  const labelEvery = days.length <= 7 ? 1 : days.length <= 30 ? 7 : 10;
  const ticks = [0, max / 2, max];

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label={`Applications and moves to interview per day, last ${days.length} days`}
        className="block"
      >
        {ticks.map((t) => {
          const y = PAD.top + plotH * (1 - t / max);
          return (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} stroke="var(--eh-line)" />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="num"
                fill="var(--eh-muted)"
                fontSize={11}
              >
                {t}
              </text>
            </g>
          );
        })}

        {days.map((day, i) => {
          const cx = PAD.left + colW * i + colW / 2;
          const base = H - PAD.bottom;
          const showLabel = (days.length - 1 - i) % labelEvery === 0;
          return (
            <g key={i}>
              {day.applications > 0 && (
                <rect
                  x={cx - barW - 1}
                  y={base - day.applications * scale}
                  width={barW}
                  height={day.applications * scale}
                  rx={2}
                  fill="var(--eh-ink)"
                >
                  <title>{`${day.tooltipDate}: ${day.applications} application${day.applications === 1 ? "" : "s"}`}</title>
                </rect>
              )}
              {day.interviews > 0 && (
                <rect
                  x={cx + 1}
                  y={base - day.interviews * scale}
                  width={barW}
                  height={day.interviews * scale}
                  rx={2}
                  fill="var(--eh-marigold)"
                >
                  <title>{`${day.tooltipDate}: ${day.interviews} moved to interview`}</title>
                </rect>
              )}
              {showLabel && (
                // Labels near either edge anchor inward so "Sep 30" isn't clipped.
                <text
                  x={cx + 22 > width - PAD.right ? width - PAD.right : cx - 22 < PAD.left ? PAD.left : cx}
                  y={H - 6}
                  textAnchor={cx + 22 > width - PAD.right ? "end" : cx - 22 < PAD.left ? "start" : "middle"}
                  fill="var(--eh-muted)"
                  fontSize={11}
                >
                  {day.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {total === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-ui text-eh-muted">
          No applications in this range. Sharing a listing is the quickest way to get more.
        </p>
      )}
    </div>
  );
}
