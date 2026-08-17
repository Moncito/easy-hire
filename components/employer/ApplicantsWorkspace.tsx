"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

type Props = {
  panelOpen: boolean;
  onClosePanel?: () => void;
  board: ReactNode;
  panel: ReactNode | null;
};

export default function ApplicantsWorkspace({ panelOpen, onClosePanel, board, panel }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useScrollLock(panelOpen && isMobile);

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {board}
      </div>

      {panelOpen && panel && (
        <>
          <div
            className="employer-drawer-backdrop fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={onClosePanel}
            aria-hidden="true"
          />
          <div className="employer-drawer-panel fixed inset-y-0 right-0 z-50 flex h-dvh max-h-dvh w-full max-w-md flex-col lg:hidden">
            {panel}
          </div>

          <aside className="employer-detail-panel-enter hidden h-full min-h-0 w-1/4 min-w-[360px] shrink-0 flex-col overflow-hidden border-l border-ink/8 bg-mist lg:flex">
            {panel}
          </aside>
        </>
      )}
    </div>
  );
}
