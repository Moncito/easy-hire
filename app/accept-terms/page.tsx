import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/employer-session";
import { hasAcceptedCurrentTerms, safeNextPath } from "@/lib/legal/terms-version";
import AcceptTermsForm from "@/components/legal/AcceptTermsForm";

export const metadata: Metadata = {
  title: "Review our Terms",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AcceptTermsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const roleHome =
    role === "EMPLOYER"
      ? "/employer/dashboard"
      : role === "ADMIN"
        ? "/admin/dashboard"
        : "/seeker/dashboard";

  const { next: rawNext } = await searchParams;
  const next = safeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext, roleHome);

  if (hasAcceptedCurrentTerms(session.user.termsVersion)) redirect(next);

  return <AcceptTermsForm next={next} role={role} />;
}
