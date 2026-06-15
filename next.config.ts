import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 네이티브 모듈(better-sqlite3)과 Prisma 어댑터는 번들링하지 않고 서버에서 직접 로드.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
