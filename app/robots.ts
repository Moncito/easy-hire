import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/shared/app-url";

const BASE = APP_URL;

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
