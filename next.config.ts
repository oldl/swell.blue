import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // The landing page lives in public/index.html; serve it at "/" ahead of app/page.tsx.
      beforeFiles: [{ source: "/", destination: "/index.html" }]
    };
  }
};

export default nextConfig;
