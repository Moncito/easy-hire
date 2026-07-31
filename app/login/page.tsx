"use client";

import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-mist">
      <div
        className="absolute left-16 top-32 hidden h-24 w-24 rounded-2xl border border-marigold/30 md:block"
        style={{
          backgroundImage: "radial-gradient(#F2A93B 1.5px, transparent 1.5px)",
          backgroundSize: "10px 10px",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute right-20 bottom-40 hidden h-20 w-20 rounded-2xl border border-teal/30 md:block"
        style={{
          backgroundImage: "radial-gradient(#1F8073 1.5px, transparent 1.5px)",
          backgroundSize: "10px 10px",
          opacity: 0.5,
        }}
      />

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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-ink hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-black/5 md:p-12">
          <h1 className="mb-2 text-center font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mb-8 text-center text-sm text-ink/60">
            Enter your details to sign in to your account
          </p>
          <LoginForm idPrefix="page-login" showSignupLink={false} />
          <p className="mt-6 text-center text-sm text-ink/55">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-ink hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </div>

      <div className="relative z-10 border-t border-ink/10 bg-mist py-6 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} EasyHire VA Solutions &nbsp;|&nbsp;{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>{" "}
        &nbsp;|&nbsp;{" "}
        <Link href="/terms" className="hover:underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}
