import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  isPostgresUrl,
  maskDatabaseUrl,
  resolveDatabaseUrl,
} from "@/lib/databaseUrl";

export async function GET() {
  const resolved = resolveDatabaseUrl();
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

  const checks = {
    authSecretSet: Boolean(process.env.AUTH_SECRET),
    authDisabled: process.env.AUTH_DISABLED === "true",
    databaseUrlSet: Boolean(rawDatabaseUrl),
    databaseIsPostgres: isPostgresUrl(rawDatabaseUrl),
    databaseResolved: Boolean(resolved.url),
    databaseSource: resolved.source ?? null,
    postgresPrismaUrlSet: Boolean(process.env.POSTGRES_PRISMA_URL?.trim()),
    postgresUrlSet: Boolean(process.env.POSTGRES_URL?.trim()),
    onVercel: Boolean(process.env.VERCEL),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const profileCount = await prisma.profile.count();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks,
      databasePreview: resolved.url ? maskDatabaseUrl(resolved.url) : null,
      profileCount,
      loginHint:
        profileCount === 0
          ? "No users in database. Run: npm run db:seed against production DATABASE_URL"
          : "Try admin@taxflow.local / Admin123!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks,
        databasePreview: resolved.url ? maskDatabaseUrl(resolved.url) : null,
        message: error instanceof Error ? error.message : "La comprobación de estado falló",
        hint: !resolved.url
          ? "Add DATABASE_URL in Vercel → Settings → Environment Variables → Production → Redeploy"
          : "Database URL is set but connection failed. Check password, aws-1 host, and port 6543 on Vercel.",
      },
      { status: 503 },
    );
  }
}
