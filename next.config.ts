import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.immobilienscout24.de" },
      { protocol: "https", hostname: "*.is24.de" },
    ],
  },
};

export default nextConfig;
