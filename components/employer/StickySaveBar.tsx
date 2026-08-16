"use client";

import { AlertCircle, Check } from "lucide-react";
import EmployerActionBar from "@/components/employer/EmployerActionBar";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProButton from "@/components/employer/pro/ProButton";

type Props = {
  visible: boolean;
  loading: boolean;
  saved: boolean;
  error: string;
  onCancel: () => void;
};

export default function StickySaveBar({ visible, loading, saved, error, onCancel }: Props) {
  const { isPro } = useEmployerShell();

  return (
    <EmployerActionBar visible={visible}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">Unsaved changes</span>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-teal">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Saved successfully
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-ember">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {error}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isPro ? (
            <>
              <ProButton type="button" onClick={onCancel} disabled={loading} variant="secondary">
                Cancel
              </ProButton>
              <ProButton type="submit" disabled={loading} variant="primary">
                {loading ? "Saving..." : "Save changes"}
              </ProButton>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 transition-all hover:border-ink/20 hover:bg-ink/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-all hover:bg-teal/95 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </EmployerActionBar>
  );
}
