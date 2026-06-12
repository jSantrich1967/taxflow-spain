const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
] as const;

export function isPostgresUrl(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return Boolean(
    trimmed?.startsWith("postgres://") || trimmed?.startsWith("postgresql://"),
  );
}

export function resolveDatabaseUrl(): {
  url?: string;
  source?: (typeof DATABASE_ENV_KEYS)[number];
} {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value && isPostgresUrl(value)) {
      return { url: value, source: key };
    }
  }

  return {};
}

export function maskDatabaseUrl(url: string): string {
  return url.replace(/:([^:@/]+)@/, ":****@");
}
