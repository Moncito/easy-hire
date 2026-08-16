"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { Sparkles } from "lucide-react";

import { useEasyAi } from "@/components/employer/pro/useEasyAi";



type InsightsResult = { narrative: string; highlights: string[] };



type Props = {

  fallback: string | null;

  variant?: "box" | "inline";

};



export default function EasyAiInsightBox({ fallback, variant = "box" }: Props) {

  const { run, isLoading } = useEasyAi();

  const [narrative, setNarrative] = useState<string | null>(null);

  const [fetched, setFetched] = useState(false);



  useEffect(() => {

    let active = true;

    (async () => {

      const result = await run<InsightsResult>("insights", {}, { silent: true });

      if (!active) return;

      setFetched(true);

      if (result?.configured && result.data?.narrative) {

        setNarrative(result.data.narrative);

      }

    })();

    return () => {

      active = false;

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const text =

    narrative ??

    (isLoading("insights") && !fetched

      ? "Summarizing hiring health…"

      : fallback ?? "Easy AI will summarize your hiring health once configured.");



  if (variant === "inline") {

    return (

      <p className="mt-2.5 flex items-start gap-2 text-sm leading-relaxed text-ink/55">

        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--pro-accent-ink)]" strokeWidth={2.25} aria-hidden="true" />

        <span>

          <span className="font-semibold text-[var(--pro-accent-ink)]">Easy AI · </span>

          {text}{" "}

          <Link href="/employer/easy-ai" className="font-semibold text-[var(--pro-accent-ink)] hover:underline">

            Open →

          </Link>

        </span>

      </p>

    );

  }



  return (

    <div className="mt-5 rounded-2xl border border-marigold/20 bg-marigold/[0.04] px-5 py-4">

      <Sparkles className="mb-2 h-4 w-4 text-[var(--pro-accent-ink)]" strokeWidth={2.25} aria-hidden="true" />

      <p className="text-xs font-bold uppercase tracking-wider text-[var(--pro-accent-ink)]">Easy AI insight</p>

      <p className="mt-1.5 text-sm leading-relaxed text-ink/60 sm:text-base">{text}</p>

      <Link

        href="/employer/easy-ai"

        className="mt-3 inline-flex text-sm font-semibold text-[var(--pro-accent-ink)] hover:underline"

      >

        Open Easy AI →

      </Link>

    </div>

  );

}

