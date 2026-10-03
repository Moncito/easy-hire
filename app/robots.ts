import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/shared/app-url";
import { IS_PRODUCTION_DEPLOYMENT } from "@/lib/shared/deploy-env";

const BASE = APP_URL;

export default function robots(): MetadataRoute.Robots {
  // Staging and local builds must never be indexed — they would compete with
  // the live site for the same job pages. See plans/STAGING-AND-RELEASE.md.
  if (!IS_PRODUCTION_DEPLOYMENT) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/employer/", "/seeker/", "/admin/", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
