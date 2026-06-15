import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL 클라이언트/네이티브 모듈과 Prisma 어댑터는 번들링하지 않고 서버에서 직접 로드.
  serverExternalPackages: ["@libsql/client", "libsql", "@prisma/adapter-libsql"],
};

export default nextConfig;
