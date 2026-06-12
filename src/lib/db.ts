import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/databaseUrl";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPostgresUrl(connectionString: string): boolean {
  return (
    connectionString.startsWith("postgres://") ||
    connectionString.startsWith("postgresql://")
  );
}

function createPrismaClient(): PrismaClient {
  const { url: connectionString } = resolveDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL) to a PostgreSQL connection string.",
    );
  }

  const log =
    process.env.NODE_ENV === "development"
      ? (["query", "error", "warn"] as const)
      : (["error"] as const);

  const isSupabase = connectionString.includes("supabase.com");
  const poolConnectionString = isSupabase
    ? connectionString.replace(/[?&]sslmode=[^&]+/g, "").replace(/\?$/, "")
    : connectionString;

  const pool = new Pool({
    connectionString: poolConnectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: [...log] });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
