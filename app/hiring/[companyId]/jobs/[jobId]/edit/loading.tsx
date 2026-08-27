import { EmployerShellProvider } from "@/components/employer/EmployerShellContext";
import JobFormSkeleton from "@/components/employer/skeletons/JobFormSkeleton";

export default function Loading() {
  return (
    <EmployerShellProvider plan="PRO">
      <JobFormSkeleton />
    </EmployerShellProvider>
  );
}
