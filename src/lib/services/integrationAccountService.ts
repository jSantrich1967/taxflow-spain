import type { IntegrationProvider, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";

export async function getIntegrationAccount(provider: IntegrationProvider) {
  return prisma.integrationAccount.findUnique({ where: { provider } });
}

export async function upsertIntegrationAccount(
  provider: IntegrationProvider,
  data: {
    label?: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    metadataJson?: Prisma.InputJsonValue;
    isActive?: boolean;
    lastSyncAt?: Date | null;
    lastSyncError?: string | null;
  },
) {
  return prisma.integrationAccount.upsert({
    where: { provider },
    update: data,
    create: {
      provider,
      ...data,
    },
  });
}

export async function getIntegrationsStatus() {
  const [gmail, hubspot] = await Promise.all([
    getIntegrationAccount("GMAIL"),
    getIntegrationAccount("HUBSPOT"),
  ]);

  return {
    gmail: {
      connected: Boolean(gmail?.refreshToken && gmail.isActive),
      email: (gmail?.metadataJson as { email?: string } | null)?.email ?? null,
      lastSyncAt: gmail?.lastSyncAt ?? null,
      lastSyncError: gmail?.lastSyncError ?? null,
    },
    hubspot: {
      connected: Boolean(
        hubspot?.accessToken || process.env.HUBSPOT_ACCESS_TOKEN,
      ),
      lastSyncAt: hubspot?.lastSyncAt ?? null,
      lastSyncError: hubspot?.lastSyncError ?? null,
    },
    autoExtractEnabled: process.env.AUTO_EXTRACT_ON_INGEST !== "false",
    cronConfigured: Boolean(process.env.CRON_SECRET),
  };
}

export async function isExternalRecordProcessed(
  provider: string,
  externalId: string,
) {
  const existing = await prisma.externalIngestionRecord.findUnique({
    where: {
      provider_externalId: { provider, externalId },
    },
  });
  return Boolean(existing);
}

export async function markExternalRecordProcessed(
  provider: string,
  externalId: string,
  caseId: string,
) {
  return prisma.externalIngestionRecord.upsert({
    where: {
      provider_externalId: { provider, externalId },
    },
    update: { caseId },
    create: { provider, externalId, caseId },
  });
}
