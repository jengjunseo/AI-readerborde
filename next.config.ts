import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/api/admin/bootstrap": ["./drizzle/**/*"],
  },
};

export default nextConfig;
