"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, LoaderCircle } from "lucide-react";
import { uploadAvatar } from "@/lib/client/uploads";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

export default function ProfilePhotoForm({ email, initialAvatarUrl }: { email: string; initialAvatarUrl: string | null }) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2MB.");
      return;
    }
    setUploading(true);
    try {
      const { ok, data } = await uploadAvatar(file);
      if (!ok || !data.avatarUrl) throw new Error(data.error || "Could not upload photo.");
      setAvatarUrl(data.avatarUrl);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload photo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <EmployerAvatar name={email} imageUrl={avatarUrl} size="lg" shape="circle" className="h-16 w-16" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change photo"
          className="absolute -bottom-1 -right-1 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-ink text-white shadow-sm transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{email}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1 cursor-pointer text-xs font-semibold text-teal transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Upload a photo"}
        </button>
      </div>
    </div>
  );
}
