import { auth } from "@/Auth";

export default async function EmployerDashboardPage() {
  const session = await auth();

  return (
    <div style={{ padding: 40 }}>
      <h1>Employer Dashboard</h1>
      <p>Logged in as: {session?.user?.email}</p>
      <p>Role: {session?.user?.role}</p>
    </div>
  );
}