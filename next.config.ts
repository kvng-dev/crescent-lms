import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "crescent-lms.fly.storage.tigris.dev",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
