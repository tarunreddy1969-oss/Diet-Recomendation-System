import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Put it directly here at the top level, NOT inside experimental */
  allowedDevOrigins: ['192.168.1.9:3000', '192.168.1.9']
};

export default nextConfig;