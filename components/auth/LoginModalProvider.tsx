"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LoginModal from "@/components/auth/LoginModal";

type LoginModalContextValue = {
  openLogin: () => void;
  closeLogin: () => void;
  isOpen: boolean;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return ctx;
}

export function useLoginModalOptional() {
  return useContext(LoginModalContext);
}

export default function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";

  const openLogin = useCallback(() => setOpen(true), []);
  const closeLogin = useCallback(() => {
    setOpen(false);
    if (isHome && searchParams.get("login") === "1") {
      router.replace("/", { scroll: false });
    }
  }, [isHome, router, searchParams]);

  useEffect(() => {
    if (isHome && searchParams.get("login") === "1") {
      setOpen(true);
    }
  }, [isHome, searchParams]);

  const value = useMemo(
    () => ({ openLogin, closeLogin, isOpen: open }),
    [openLogin, closeLogin, open]
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      {isHome && <LoginModal open={open} onClose={closeLogin} />}
    </LoginModalContext.Provider>
  );
}
