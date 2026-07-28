import Link from "next/link";
import { Code, Heart, Mail } from "lucide-react";

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
        { label: "Employer login", href: "/login" },
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
    <footer className="border-t border-ink/10 bg-gradient-to-b from-mist to-mist/80 px-8 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="font-display font-bold text-ink">EasyHire</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Connecting Virtual Assistants with verified employers worldwide.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href="https://github.com"
                className="rounded-full bg-navy/10 p-2 text-navy/70 transition-all hover:bg-navy/20 hover:text-navy"
                title="GitHub"
              >
                <Code className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                className="rounded-full bg-navy/10 p-2 text-navy/70 transition-all hover:bg-navy/20 hover:text-navy"
                title="LinkedIn"
              >
                <Heart className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@easyhire.com"
                className="rounded-full bg-navy/10 p-2 text-navy/70 transition-all hover:bg-navy/20 hover:text-navy"
                title="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 font-display text-sm font-semibold text-ink">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/70 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-ink/60 md:flex-row">
            <p>&copy; {new Date().getFullYear()} EasyHire VA Solutions. All rights reserved.</p>
            <p>Made with care for the global VA community.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}