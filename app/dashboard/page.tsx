import { auth } from "@/Auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "SEEKER") {
    redirect("/seeker/dashboard");
  } else if (session.user.role === "EMPLOYER") {
    redirect("/employer/dashboard");
  } else if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/");
}