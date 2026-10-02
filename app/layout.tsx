import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/AuthProvider";
import CommandPalette from "@/components/CommandPalette";
import { getSession } from "@/lib/employer-session";
import { BASE_URL } from "@/lib/seo/base-url";
import { IS_PRODUCTION_DEPLOYMENT } from "@/lib/shared/deploy-env";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  // Required for relative OG image URLs (including the generated
  // app/opengraph-image.tsx) and any relative `metadata` URL fields
  // anywhere in the app to resolve to an absolute URL.
  metadataBase: new URL(BASE_URL),
  title: {
    // Child routes set a bare `title` (e.g. "Pricing") and get this
    // suffix appended automatically — they must NOT also hardcode
    // "— EasyHire" themselves, or it doubles up.
    template: "%s — EasyHire",
    default: "EasyHire VA Solutions",
  },
  description: "Find verified VA jobs, or hire your next virtual assistant.",
  // robots.txt already disallows crawling off production; this also covers
  // pages a crawler reaches through an external link.
  ...(IS_PRODUCTION_DEPLOYMENT ? {} : { robots: { index: false, follow: false } }),
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="en" className={`scroll-smooth overflow-x-hidden ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="overflow-x-hidden font-body antialiased">
        {!IS_PRODUCTION_DEPLOYMENT && (
          // Fixed and click-through so it never shifts a layout or covers a
          // control; the public header is itself fixed to the top.
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-3 right-3 z-[100] rounded-full bg-navy px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-mist opacity-90 shadow-lg"
          >
            STAGING · test data
          </div>
        )}
        <AuthProvider session={session}>
          {children}
          <CommandPalette />
          <Toaster
            position="top-right"
            toastOptions={{
              className: "font-body",
              style: { background: "#20242B", color: "#F5F6F4", border: "1px solid rgba(245,246,244,0.12)" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}