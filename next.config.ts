import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native SQLite out of Turbopack/Webpack SSR bundles
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
