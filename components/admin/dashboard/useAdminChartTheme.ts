"use client";

import { useEffect, useState } from "react";

export type AdminChartTheme = "light" | "dark";

/**
 * Bridges `AdminHeader.tsx`'s `document.documentElement.dataset.adminTheme`
 * ("light" | "dark", unset defaults to light) into a plain React value a
 * Recharts SVG can consume as `stroke`/`fill` props — the `admin-dark:`
 * Tailwind custom variant (app/globals.css) reacts to that same DOM
 * attribute directly for ordinary elements, but Recharts renders its own SVG
 * with explicit color props, which cannot pick up a CSS variant the way a
 * `className` does.
 *
 * There is no shared React context for admin theme today — AdminHeader.tsx's
 * own doc comment is explicit that "nothing else in this component tree
 * needs to know the current theme in its OWN render logic," since every
 * other consumer re-themes purely through the CSS cascade. A chart is the
 * one real exception, so this hook is the minimal bridge for exactly that
 * case: read the attribute once on mount (SSR-safe — defaults to "light"
 * before the client can read the DOM, matching AdminHeader.tsx's own
 * pre-hydration default), then keep it in sync with a `MutationObserver` on
 * that one attribute, not a new app-wide context provider.
 */
export function useAdminChartTheme(): AdminChartTheme {
  const [theme, setTheme] = useState<AdminChartTheme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset.adminTheme === "dark" ? "dark" : "light");
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-admin-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
