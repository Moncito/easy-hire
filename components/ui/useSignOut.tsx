"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { signOut as nextAuthSignOut } from "next-auth/react";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Sign-out with a branded full-screen loader. `next-auth`'s `signOut` clears
 * the session then does a full navigation, which takes a visible beat — without
 * feedback the Log out button just sits there. Call `signOut` from any handler
 * and render `overlay` somewhere in the component; the overlay stays up until
 * the redirect lands (the promise never resolves in-page).
 */
export function useSignOut(callbackUrl = "/") {
  const [pending, setPending] = useState(false);

  const signOut = useCallback(() => {
    if (pending) return;
    setPending(true);
    void nextAuthSignOut({ callbackUrl });
  }, [pending, callbackUrl]);

  const overlay =
    pending && typeof document !== "undefined"
      ? createPortal(<FullScreenLoader label="Signing you out…" />, document.body)
      : null;

  return { signOut, pending, overlay };
}
