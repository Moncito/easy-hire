import type { ChangeEvent, RefObject } from "react";
import { Camera, Globe } from "lucide-react";

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

function statusChip(status: VerificationStatus) {
  if (status === "verified") {
    return (
      <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-teal">
        Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-ember/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ember">
        Needs update
      </span>
    );
  }
  return (
    <span className="rounded-full bg-ink/8 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink/55">
      Pending review
    </span>
  );
}

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
  return (
    <section className="pro-card mb-5 overflow-hidden">
      <div className="group relative h-44 w-full overflow-hidden sm:h-56">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-ink/15 via-marigold/25 to-ink/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-ink/5 to-transparent" />
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
          className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-marigold px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm shadow-marigold/20 transition hover:bg-marigold/90 disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          {bannerUploading ? "Uploading..." : bannerUrl ? "Change banner" : "Upload banner"}
        </button>
      </div>

      <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
        <div className="group/logo relative shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-16 w-16 rounded-xl border-2 border-white bg-ink object-cover shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white bg-marigold font-display text-xl font-bold text-ink shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]">
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
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-marigold text-ink shadow-sm hover:bg-marigold/90 disabled:opacity-60"
            aria-label={logoUploading ? "Uploading logo" : "Upload company logo"}
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-black tracking-tight text-ink sm:text-2xl">
              {companyName || "Your Company"}
            </h2>
            {statusChip(verificationStatus)}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
            <span>{industry || "Industry not set"}</span>
            {website && (
              <>
                <span className="text-ink/20" aria-hidden="true">
                  &bull;
                </span>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#9A5B12] transition hover:underline"
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
