import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// libSQL 어댑터: 로컬은 file: URL, 운영은 Turso(libsql://) + 인증 토큰.
// 같은 어댑터로 개발/운영 모두 커버되며 스키마 provider 는 "sqlite" 그대로.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
