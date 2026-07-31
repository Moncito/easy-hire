import { Suspense } from "react";
import SignupPageClient from "./SignupPageClient";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mist">
          <p className="text-sm text-ink/60">Loading signup...</p>
        </div>
      }
    >
      <SignupPageClient />
    </Suspense>
  );
}
