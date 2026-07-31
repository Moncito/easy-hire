import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include Prisma query engines in Vercel serverless bundles (custom output path).
  outputFileTracingIncludes: {
    "/*": ["./prisma/gen/**/*"],
    "/api/*": ["./prisma/gen/**/*"],
  },
};

export default nextConfig;
