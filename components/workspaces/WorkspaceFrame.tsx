import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export default function WorkspaceFrame({ sidebar, queueHref, children }: { sidebar: React.ReactNode; queueHref: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#eef3f6] text-ink lg:pl-60">{sidebar}<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink/8 bg-[#eef3f6]/90 px-5 backdrop-blur lg:hidden"><span className="font-display text-lg font-black">EasyHire</span><Link href={queueHref} className="inline-flex items-center gap-2 text-sm font-semibold text-teal"><ClipboardCheck className="h-4 w-4" />Review queue</Link></header>{children}</div>;
}
