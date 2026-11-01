import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  turbopack: { root: path.resolve(process.cwd(), "..") },
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          (process.env.BACKEND_ORIGIN || "http://127.0.0.1:3001") +
          "/api/:path*",
      },
    ];
  },
};
export default config;
