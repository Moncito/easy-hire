"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import RoleStep from "@/components/signup/RoleStep";
import CredentialsStep from "@/components/signup/CredentialsStep";
import SeekerProfileStep from "@/components/signup/SeekerProfileStep";
import EmployerProfileStep from "@/components/signup/EmployerProfileStep";
import SuccessStep from "@/components/signup/SuccessStep";
import {
  Role,
  CredentialsData,
  SeekerProfileData,
  EmployerProfileData,
} from "@/components/signup/types";

type Step = "role" | "credentials" | "profile" | "success";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentialsSubmit(data: CredentialsData) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, role }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto sign-in right after registration — no email verification gate.
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created, but sign-in failed. Try logging in manually.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("profile");
  }

  async function handleSeekerProfileComplete(data: SeekerProfileData) {
    setLoading(true);
    await fetch("/api/profile/seeker", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    finishSignup();
  }

  async function handleEmployerProfileComplete(data: EmployerProfileData) {
    setLoading(true);
    await fetch("/api/profile/employer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    finishSignup();
  }

  function handleSkip() {
    finishSignup();
  }

  function finishSignup() {
    setLoading(false);
    setStep("success");
    setTimeout(() => {
      router.push(role === "SEEKER" ? "/seeker/dashboard" : "/employer/dashboard");
    }, 2000);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-mist">
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-marigold/25 to-teal/25 blur-3xl md:h-96 md:w-96" />

      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <span className="font-display text-lg font-bold text-ink">EasyHire</span>
        </Link>
        <p className="text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {step === "role" && (
            <RoleStep
              onSelect={(selected) => {
                setRole(selected);
                setStep("credentials");
              }}
            />
          )}

          {step === "credentials" && role && (
            <CredentialsStep
              role={role}
              loading={loading}
              serverError={error}
              onSubmit={handleCredentialsSubmit}
            />
          )}

          {step === "profile" && role === "SEEKER" && (
            <SeekerProfileStep
              loading={loading}
              onComplete={handleSeekerProfileComplete}
              onSkip={handleSkip}
            />
          )}

          {step === "profile" && role === "EMPLOYER" && (
            <EmployerProfileStep
              loading={loading}
              onComplete={handleEmployerProfileComplete}
              onSkip={handleSkip}
            />
          )}

          {step === "success" && role && <SuccessStep role={role} />}
        </div>
      </div>

      <div className="relative z-10 border-t border-ink/10 py-6 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} EasyHire VA Solutions &nbsp;|&nbsp;{" "}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}
        &nbsp;|&nbsp;{" "}
        <Link href="/terms" className="hover:underline">Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}