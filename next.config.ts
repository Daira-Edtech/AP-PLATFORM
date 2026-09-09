import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on Azure App Service: emit a minimal standalone server
  // instead of shipping the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
