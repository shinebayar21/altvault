import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Зураг 5MB хүртэл + олон өнгөний зураг нэг формоор явдаг тул
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
