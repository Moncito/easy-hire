"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  async function accept() {
    setStatus("loading"); setError("");
    const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) { setStatus("idle"); return setError(data.error || "Could not accept invitation."); }
    setStatus("done");
    router.push("/hiring");
  }
  return <main className="mx-auto flex min-h-screen max-w-xl items-center px-6"><section className="w-full rounded-2xl border border-ink/8 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">EasyHire</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Join the hiring team</h1><p className="mt-3 text-sm leading-6 text-ink/60">Accepting gives you access to the company’s private hiring workspace according to the role in your invitation.</p>{error && <p role="alert" className="mt-4 text-sm text-ember">{error}</p>}<button onClick={accept} disabled={status !== "idle"} className="mt-6 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{status === "loading" ? "Accepting…" : status === "done" ? "Accepted" : "Accept invitation"}</button></section></main>;
}
