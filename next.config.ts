import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    proxyClientMaxBodySize: "27mb",
  },
};

export default nextConfig;
