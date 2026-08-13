import Link from "next/link";
import { Code, Heart, Mail } from "lucide-react";
import FooterLoginLink from "@/components/landing/FooterLoginLink";

export default function EmployerMarketingFooter() {
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
        { label: "Post a job", href: "/employers" },
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
    <footer className="emp-bg-section relative overflow-hidden border-t emp-border">
      <div className="px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
            <div>
              <p className="emp-text font-display text-base font-bold">EasyHire</p>
              <p className="emp-text-secondary mt-3 text-sm leading-relaxed">
                Connecting Virtual Assistants with verified employers worldwide.
              </p>
              <div className="mt-5 flex gap-2">
                <a
                  href="https://github.com"
                  className="rounded-full bg-teal/10 p-2 text-teal/70 transition-all hover:bg-teal/15 hover:text-teal"
                  title="GitHub"
                >
                  <Code className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  className="rounded-full bg-teal/10 p-2 text-teal/70 transition-all hover:bg-teal/15 hover:text-teal"
                  title="LinkedIn"
                >
                  <Heart className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@easyhire.com"
                  className="rounded-full bg-teal/10 p-2 text-teal/70 transition-all hover:bg-teal/15 hover:text-teal"
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {columns.map((col) => (
              <div key={col.heading}>
                <p className="emp-text-muted mb-5 font-display text-xs font-semibold tracking-widest uppercase">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"isLogin" in link && link.isLogin ? (
                        <FooterLoginLink className="emp-text-secondary text-sm transition-colors hover:text-teal" />
                      ) : (
                        <Link
                          href={link.href}
                          className="emp-text-secondary text-sm transition-colors hover:text-teal"
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

          <div className="border-t pt-8 emp-border">
            <div className="emp-text-muted flex flex-col items-center justify-between gap-4 text-xs md:flex-row">
              <p>&copy; {new Date().getFullYear()} EasyHire VA Solutions. All rights reserved.</p>
              <p>Made with care for the global VA community.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none select-none overflow-hidden text-center leading-none"
        aria-hidden="true"
      >
        <span
          className="font-display font-extrabold text-[18vw] leading-none"
          style={{ color: "transparent", WebkitTextStroke: "1px var(--emp-footer-watermark)" }}
        >
          EasyHire
        </span>
      </div>
    </footer>
  );
}
