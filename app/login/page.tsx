import Link from "next/link";
import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import AuthHeader from "@/components/auth/AuthHeader";
import LoginForm from "@/components/auth/LoginForm";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { BrandMark } from "@/components/brand/BrandMark";
import { safeNextPath } from "@/lib/legal/terms-version";

export const metadata = { title: "Sign in" };

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

const trustPoints = [
  { icon: BadgeCheck, text: "Seekers never pay to apply or get hired" },
  { icon: ShieldCheck, text: "Every company is reviewed before it hires" },
  { icon: Lock, text: "You control your data — export or delete it anytime" },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next), "/dashboard");

  return (
    <AuthPageShell
      wide
      topRight={
        <>
          New to EasyHire?{" "}
          <Link href="/signup" className={`font-semibold text-ink underline-offset-2 hover:underline ${focusRing}`}>
            Sign up
          </Link>
        </>
      }
    >
        <div className="grid w-full overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-xl shadow-black/5 lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-center">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-marigold/25 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-teal/30 blur-3xl" />
            </div>
            <div className="relative">
              <BrandMark className="h-10 w-10" />
              <p className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight">
                Verified VA jobs. Vetted employers.
              </p>
              <ul className="mt-7 space-y-4">
                {trustPoints.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-snug text-white/90">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="pt-1.5">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="p-6 sm:p-8 lg:p-10">
            <AuthHeader className="mb-5" />
            <LoginForm idPrefix="page-login" showSignupLink={false} next={next} />
          </div>
        </div>
    </AuthPageShell>
  );
}
