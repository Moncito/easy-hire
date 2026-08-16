import Link from "next/link";

import { Briefcase, Search, Share2, Users } from "lucide-react";



const QUICK_LINKS = [

  { label: "Post a role", href: "/employer/jobs/new", icon: Briefcase },

  { label: "Search talent", href: "/employer/talent", icon: Search },

  { label: "Review pipeline", href: "/employer/applicants", icon: Users },

  { label: "Share listings", href: "/employer/jobs", icon: Share2 },

] as const;



type Props = {

  profileCompletion?: number;

};



/** Subordinate open quick links — not a floating pill card. */

export default function ProQuickLinksToolbar({ profileCompletion }: Props) {

  return (

    <nav

      aria-label="Dashboard quick links"

      className="flex flex-wrap items-center gap-x-1 gap-y-1.5 border-y border-ink/[0.06] py-2.5"

    >

      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-ink/35">Quick links</span>

      {QUICK_LINKS.map((link, i) => {

        const Icon = link.icon;

        return (

          <span key={link.href} className="inline-flex items-center">

            {i > 0 && (

              <span className="mx-1.5 text-ink/15 sm:mx-2" aria-hidden="true">

                ·

              </span>

            )}

            <Link

              href={link.href}

              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition hover:text-teal focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25"

            >

              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />

              {link.label}

            </Link>

          </span>

        );

      })}

      {profileCompletion !== undefined && profileCompletion < 100 && (

        <>

          <span className="mx-1.5 text-ink/15 sm:mx-2" aria-hidden="true">

            ·

          </span>

          <Link

            href="/employer/company-profile"

            className="text-sm font-medium text-teal transition hover:underline focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25"

          >

            Complete profile ({profileCompletion}%)

          </Link>

        </>

      )}

    </nav>

  );

}

