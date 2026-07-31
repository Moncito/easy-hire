"use client";

import Link from "next/link";
import { useLoginModalOptional } from "@/components/auth/LoginModalProvider";

export default function FooterLoginLink() {
  const loginModal = useLoginModalOptional();
  const className = "text-sm text-ink/70 transition-colors hover:text-ink";

  if (loginModal) {
    return (
      <button type="button" onClick={() => loginModal.openLogin()} className={className}>
        Employer login
      </button>
    );
  }

  return (
    <Link href="/login" className={className}>
      Employer login
    </Link>
  );
}
