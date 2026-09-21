import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: process.env.NODE_ENV === "production" ? "/system-snacks/" : undefined,
};
export default nextConfig;
