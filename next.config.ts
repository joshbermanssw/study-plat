import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Lecture slide decks can be 30-100 MB; default 1 MB is too small.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
