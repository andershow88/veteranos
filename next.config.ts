import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray package-lock.json in a
  // parent directory can't make Next infer the wrong root for file tracing.
  turbopack: { root: __dirname },
};

export default nextConfig;
