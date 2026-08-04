import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * TURSO_DATABASE_URL/TURSO_AUTH_TOKEN unset -> falls back to the local sqlite
 * file (same file the Prisma CLI uses via DATABASE_URL), so local dev needs
 * no Turso account. Once those are set, every /admin session (CTO + PR) reads
 * the same shared, network-hosted database instead of one machine's disk.
 */
function buildLibsqlConfig() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    return { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  const localPath = path.join(process.cwd(), "prisma", "dev.db");
  return { url: `file:${localPath}` };
}

function buildPrismaClient() {
  const adapter = new PrismaLibSQL(buildLibsqlConfig());
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
