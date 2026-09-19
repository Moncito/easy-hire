import { useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { inputClassName, type UpdateField } from "./shared";

type Props = {
  fullName: string;
  location: string;
  phone: string;
  photoUrl: string | null;
  photoUploading: boolean;
  onChange: UpdateField;
  onPhotoUpload: (file: File) => void;
};

export default function BasicsBucket({
  fullName,
  location,
  phone,
  photoUrl,
  photoUploading,
  onChange,
  onPhotoUpload,
}: Props) {
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Full name
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          className={inputClassName}
          required
        />
      </div>
      <div>
        <label htmlFor="location" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Location
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="e.g. Cebu, Philippines"
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Phone
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={inputClassName}
        />
      </div>
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Photo</p>
        <p className="mb-3 text-sm text-ink/55">JPEG, PNG, or WebP. Max 2MB.</p>
        <div className="flex flex-wrap items-center gap-4">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-marigold/15 font-display text-xl font-bold text-marigold">
              {(fullName?.[0] || "V").toUpperCase()}
            </div>
          )}
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoUpload(file);
            }}
          />
          <button
            type="button"
            disabled={photoUploading}
            onClick={() => photoRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-[#8a5a10] hover:bg-marigold/15 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {photoUploading ? "Uploading..." : photoUrl ? "Replace photo" : "Upload photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
