import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    proxyClientMaxBodySize: "27mb",
  },
};

export default nextConfig;
