import { parseJsonBody } from "@/lib/client/fetch-json";

async function uploadFile(url: string, file: File, fieldName = "file") {
  const body = new FormData();
  body.append(fieldName, file);
  const res = await fetch(url, { method: "POST", body });
  const data = await parseJsonBody(res);
  return { ok: res.ok, data: data as { error?: string; url?: string; bannerUrl?: string; logoUrl?: string; fileName?: string; resumeUrl?: string; photoUrl?: string; avatarUrl?: string; resumeUpdatedAt?: string; resumes?: string[] } };
}

export async function uploadResume(file: File) {
  return uploadFile("/api/upload/resume", file);
}

export async function uploadPhoto(file: File) {
  return uploadFile("/api/upload/photo", file);
}

export async function uploadAvatar(file: File) {
  return uploadFile("/api/upload/avatar", file);
}

export async function uploadBanner(file: File) {
  return uploadFile("/api/upload/banner", file);
}

export async function uploadLogo(file: File) {
  return uploadFile("/api/upload/logo", file);
}

export async function uploadVerificationDoc(file: File) {
  return uploadFile("/api/upload/verification-doc", file);
}
