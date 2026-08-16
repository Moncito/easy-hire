import { Bookmark, Sparkles } from "lucide-react";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProTalentPerkStrip from "@/components/employer/pro-dashboard/ProTalentPerkStrip";
import ProButton from "@/components/employer/pro/ProButton";

type Props = {
  resultCount?: number;
  savedMode?: boolean;
};

export default function ProTalentPageHeader({ resultCount, savedMode = false }: Props) {
  return (
    <>
      <ProPageHeader
        title="Talent"
        description="Search verified VA profiles, save them to lists, and message without leaving EasyHire."
        stats={
          resultCount != null ? (
            <>
              <span>
                <span className="font-data font-semibold text-ink">{resultCount}</span>{" "}
                {savedMode
                  ? resultCount === 1
                    ? "saved profile"
                    : "saved profiles"
                  : resultCount === 1
                    ? "profile"
                    : "profiles"}
              </span>
              {savedMode && <span>Showing bookmarks only</span>}
            </>
          ) : undefined
        }
        actions={
          <>
            <ProButton
              href="/employer/talent/lists"
              variant="secondary"
              icon={<Bookmark className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />}
            >
              Saved lists
            </ProButton>
            <ProButton
              href="/employer/easy-ai"
              variant="secondary"
              icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />}
            >
              Easy AI
            </ProButton>
          </>
        }
      />
      <ProTalentPerkStrip />
    </>
  );
}
