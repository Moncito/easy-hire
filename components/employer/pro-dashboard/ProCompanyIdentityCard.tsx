import type { ChangeEvent, RefObject } from "react";
import { Camera, Globe } from "lucide-react";
import { StatusBadge } from "@/components/employer/system";

type VerificationStatus = "pending" | "verified" | "rejected";

type Props = {
  bannerUrl: string | null;
  logoUrl: string | null;
  logoInitials: string;
  companyName: string;
  industry: string;
  website: string;
  verificationStatus: VerificationStatus;
  bannerUploading: boolean;
  logoUploading: boolean;
  bannerInputRef: RefObject<HTMLInputElement | null>;
  logoInputRef: RefObject<HTMLInputElement | null>;
  onBannerChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const STATUS: Record<VerificationStatus, { tone: "success" | "danger" | "info"; label: string }> = {
  verified: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Needs update" },
  pending: { tone: "info", label: "Pending review" },
};

/**
 * How the company appears to VAs: banner, logo overlapping it, name,
 * verification, industry and website — with the banner and logo editable
 * in place. Same layout as the talent profile hero, so identity pages
 * read alike across the workspace.
 */
export default function ProCompanyIdentityCard({
  bannerUrl,
  logoUrl,
  logoInitials,
  companyName,
  industry,
  website,
  verificationStatus,
  bannerUploading,
  logoUploading,
  bannerInputRef,
  logoInputRef,
  onBannerChange,
  onLogoChange,
}: Props) {
  const status = STATUS[verificationStatus];

  return (
    <section
      aria-label="Company identity"
      className="mb-6 overflow-hidden rounded-card border border-eh-line bg-eh-surface shadow-eh-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-eh-navy sm:h-52">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner of unknown host.
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onBannerChange}
        />
        <button
          type="button"
          disabled={bannerUploading}
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-control border border-white/25 bg-[rgb(20_24_32/0.55)] px-3 text-small font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-[rgb(20_24_32/0.7)] disabled:opacity-50"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {bannerUploading ? "Uploading…" : bannerUrl ? "Change banner" : "Upload banner"}
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6">
        <div className="relative -mt-10 shrink-0 sm:-mt-12">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo of unknown host.
            <img
              src={logoUrl}
              alt=""
              className="h-20 w-20 rounded-card border-4 border-eh-surface bg-eh-surface object-cover shadow-eh-md sm:h-24 sm:w-24"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-card border-4 border-eh-surface bg-eh-marigold font-heading text-2xl font-bold text-[#241500] shadow-eh-md sm:h-24 sm:w-24">
              {logoInitials}
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onLogoChange}
          />
          <button
            type="button"
            disabled={logoUploading}
            onClick={() => logoInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-eh-surface bg-eh-marigold text-[#241500] shadow-eh-sm transition-colors duration-150 hover:bg-eh-marigold-strong disabled:opacity-60"
            aria-label={logoUploading ? "Uploading logo" : "Change company logo"}
            title="Change logo"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0 flex-1 sm:pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] text-eh-ink">
              {companyName || "Your Company"}
            </h2>
            <StatusBadge tone={status.tone} dot>
              {status.label}
            </StatusBadge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-ui text-eh-muted">
            <span>{industry || "Industry not set"}</span>
            {website && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-chip font-medium text-eh-teal-ink transition-colors duration-150 hover:text-eh-ink"
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {website.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
