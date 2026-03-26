import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-mdx-remote"],
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  async rewrites() {
    return [
      {
        source: "/docs/:slug.mdx",
        destination: "/docs.mdx/:slug",
      },
    ];
  },
};

export default nextConfig;
