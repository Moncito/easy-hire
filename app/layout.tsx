import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/AuthProvider";
import CommandPalette from "@/components/CommandPalette";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "EasyHire VA Solutions",
  description: "Find verified VA jobs, or hire your next virtual assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`scroll-smooth ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
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