"use client";

import type { ReactNode } from "react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: ReactNode;
};

export default function JobFormPageShell({ title, description, children, footer }: Props) {
  const { isPro } = useEmployerShell();

  if (isPro) {
    return (
      <>
        <ProPageHeader title={title} description={description} />
        {children}
        {footer}
      </>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
      </div>
      {children}
      {footer}
    </>
  );
}
