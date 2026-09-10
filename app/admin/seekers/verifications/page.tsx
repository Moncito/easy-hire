import { redirect } from "next/navigation";

/**
 * Legacy path — see the note in app/admin/jobs/page.tsx. The seeker identity
 * verification queue now lives at /admin/queues/seekers.
 */
export default function AdminSeekerVerificationsPage() {
  redirect("/admin/queues/seekers");
}
