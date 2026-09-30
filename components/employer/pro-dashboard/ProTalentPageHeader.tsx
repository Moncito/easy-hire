import { Bookmark, Sparkles } from "lucide-react";
import { Button, PageHeader } from "@/components/employer/system";

type Props = {
  resultCount?: number;
  savedMode?: boolean;
};

export default function ProTalentPageHeader({ resultCount, savedMode = false }: Props) {
  const noun = savedMode
    ? resultCount === 1
      ? "saved profile"
      : "saved profiles"
    : resultCount === 1
      ? "profile"
      : "profiles";

  return (
    <PageHeader
      className="mb-6"
      title="Talent"
      description="Search verified VA profiles, save them to lists, and message without leaving EasyHire."
      meta={
        resultCount != null ? (
          <>
            <span>
              <b className="num font-semibold text-eh-ink">{resultCount}</b> {noun}
            </span>
            {savedMode && (
              <>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span>Showing bookmarks only</span>
              </>
            )}
          </>
        ) : undefined
      }
      actions={
        <>
          <Button href="/employer/talent/lists" icon={<Bookmark />}>
            Saved lists
          </Button>
          <Button href="/employer/easy-ai" icon={<Sparkles />}>
            Easy AI
          </Button>
        </>
      }
    />
  );
}
