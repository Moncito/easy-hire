"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export default function CopyProfileLinkButton() {
  const [copying, setCopying] = useState(false);

  const copy = useCallback(async () => {
    if (copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Couldn't copy link");
    } finally {
      setCopying(false);
    }
  }, [copying]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "0.75rem 0 1.25rem",
      }}
    >
      <button
        type="button"
        onClick={copy}
        disabled={copying}
        className="cursor-pointer"
        aria-label="Copy profile link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          background: "transparent",
          border: "1px solid #E4E2DC",
          borderRadius: 7,
          padding: "0.35rem 0.875rem",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "#6F6E69",
          cursor: copying ? "wait" : "pointer",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          if (copying) return;
          e.currentTarget.style.borderColor = "#D4930A";
          e.currentTarget.style.color = "#111110";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E4E2DC";
          e.currentTarget.style.color = "#6F6E69";
        }}
      >
        Copy profile link
      </button>
    </div>
  );
}
