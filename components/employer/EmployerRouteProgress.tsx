"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

export default function EmployerRouteProgress() {
  const pathname = usePathname();
  const { expanded } = useEmployerShell();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(15);

    const t1 = window.setTimeout(() => setProgress(55), 60);
    const t2 = window.setTimeout(() => setProgress(85), 180);
    const t3 = window.setTimeout(() => setProgress(100), 320);
    const t4 = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 520);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`employer-route-progress pointer-events-none fixed right-0 top-14 z-[60] h-0.5 bg-teal/10 transition-[left] duration-200 ease-out lg:top-14 ${
        expanded ? "lg:left-52" : "lg:left-[60px]"
      } left-0`}
      aria-hidden="true"
    >
      <div
        className="employer-route-progress-bar h-full bg-teal"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
