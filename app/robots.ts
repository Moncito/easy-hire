import type { MetadataRoute } from "next";

const BASE = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://easyhire.ph";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/employer/", "/seeker/", "/admin/", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
