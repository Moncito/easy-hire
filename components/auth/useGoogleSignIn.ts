"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Starts Google sign-in at most once per page view. A second click starts a
 * new OAuth flow whose PKCE cookie overwrites the first, so Google's callback
 * for the first flow fails with "invalid_grant: Invalid code verifier".
 *
 * `pending` resets if signIn rejects, or when the page is restored from the
 * back/forward cache (user pressed Back on Google's consent screen) — without
 * that the button would stay disabled until a manual reload.
 */
export function useGoogleSignIn(callbackUrl: string) {
  const [pending, setPending] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        startedRef.current = false;
        setPending(false);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function start(beforeRedirect?: () => void) {
    if (startedRef.current) return;
    startedRef.current = true;
    setPending(true);
    beforeRedirect?.();
    signIn("google", { callbackUrl }).catch(() => {
      startedRef.current = false;
      setPending(false);
    });
  }

  return { pending, start };
}
