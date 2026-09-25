import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const githubPagesConfig: Partial<NextConfig> = isGithubPages
  ? {
      output: "export",
      basePath: "/fabsource",
      assetPrefix: "/fabsource/",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

const nextConfig: NextConfig = {
  ...githubPagesConfig,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    optimizePackageImports: ["recharts"],
  },
};

export default nextConfig;
