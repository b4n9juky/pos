import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["node-thermal-printer", "mysql2", "bcryptjs", "drizzle-orm"],
};

export default nextConfig;
