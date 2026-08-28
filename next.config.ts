import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  // Bundle the Linux query engine on Vercel; avoid serverExternalPackages here
  // because it breaks Turbopack dev resolution of `.prisma/client/default`.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/**/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
