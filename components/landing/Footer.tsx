import Link from "next/link";
import { Code, Heart, Mail } from "lucide-react";
import FooterLoginLink from "@/components/landing/FooterLoginLink";

export default function Footer() {
  const columns = [
    {
      heading: "For talent",
      links: [
        { label: "Browse jobs", href: "/jobs" },
        { label: "Create profile", href: "/signup" },
      ],
    },
    {
      heading: "For employers",
      links: [
        { label: "Post a job", href: "/signup" },
        { label: "Employer login", href: "/login", isLogin: true },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-ink/10 bg-mist">
      {/* Main footer content */}
      <div className="px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
            {/* Brand column */}
            <div>
              <p className="font-display text-base font-bold text-ink">EasyHire</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/55">
                Connecting Virtual Assistants with verified employers worldwide.
              </p>
              <div className="mt-5 flex gap-2">
                <a
                  href="https://github.com"
                  className="rounded-full bg-navy/8 p-2 text-navy/60 transition-all hover:bg-navy/15 hover:text-navy"
                  title="GitHub"
                >
                  <Code className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  className="rounded-full bg-navy/8 p-2 text-navy/60 transition-all hover:bg-navy/15 hover:text-navy"
                  title="LinkedIn"
                >
                  <Heart className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@easyhire.com"
                  className="rounded-full bg-navy/8 p-2 text-navy/60 transition-all hover:bg-navy/15 hover:text-navy"
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="mb-5 font-display text-xs font-semibold tracking-widest uppercase text-ink/50">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"isLogin" in link && link.isLogin ? (
                        <FooterLoginLink />
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-ink/65 transition-colors hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-ink/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-xs text-ink/50 md:flex-row">
              <p>&copy; {new Date().getFullYear()} EasyHire VA Solutions. All rights reserved.</p>
              <p>Made with care for the global VA community.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Giant watermark wordmark */}
      <div
        className="pointer-events-none select-none overflow-hidden text-center leading-none"
        aria-hidden="true"
      >
        <span
          className="font-display font-extrabold text-[18vw] leading-none"
          style={{ color: "transparent", WebkitTextStroke: "1px rgba(32,36,43,0.12)" }}
        >
          EasyHire
        </span>
      </div>
    </footer>
  );
}