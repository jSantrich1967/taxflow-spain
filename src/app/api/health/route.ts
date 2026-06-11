import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function isPostgresUrl(value: string | undefined): boolean {
  return Boolean(
    value?.startsWith("postgres://") || value?.startsWith("postgresql://"),
  );
}

export async function GET() {
  const checks = {
    authSecretSet: Boolean(process.env.AUTH_SECRET),
    authDisabled: process.env.AUTH_DISABLED === "true",
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    databaseIsPostgres: isPostgresUrl(process.env.DATABASE_URL),
    onVercel: Boolean(process.env.VERCEL),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const profileCount = await prisma.profile.count();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks,
      profileCount,
      loginHint:
        profileCount === 0
          ? "No users in database. Run: npm run db:seed against production DATABASE_URL"
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks,
        message: error instanceof Error ? error.message : "Health check failed",
        hint: !checks.databaseIsPostgres
          ? "Vercel requires PostgreSQL DATABASE_URL (Neon, Supabase, or Vercel Postgres)"
          : "Run npx prisma db push with your production DATABASE_URL, then npm run db:seed",
      },
      { status: 503 },
    );
  }
}
