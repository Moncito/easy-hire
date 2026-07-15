import { auth } from "@/Auth";

export default async function SeekerDashboardPage() {
  const session = await auth();

  return (
    <div style={{ padding: 40 }}>
      <h1>Seeker Dashboard</h1>
      <p>Logged in as: {session?.user?.email}</p>
      <p>Role: {session?.user?.role}</p>
    </div>
  );
}