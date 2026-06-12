import { syncGmailInbox } from "@/lib/services/gmailSyncService";
import { syncHubSpotContacts } from "@/lib/services/hubspotSyncService";

export interface IntegrationSyncSummary {
  gmail: Awaited<ReturnType<typeof syncGmailInbox>>;
  hubspot: Awaited<ReturnType<typeof syncHubSpotContacts>>;
}

export async function runAllIntegrationSyncs(): Promise<IntegrationSyncSummary> {
  const [gmail, hubspot] = await Promise.all([
    syncGmailInbox().catch((error) => ({
      success: false,
      processed: 0,
      createdCases: 0,
      errors: [error instanceof Error ? error.message : "La sincronización de Gmail falló"],
    })),
    syncHubSpotContacts().catch((error) => ({
      success: false,
      processed: 0,
      createdCases: 0,
      errors: [error instanceof Error ? error.message : "La sincronización de HubSpot falló"],
    })),
  ]);

  return { gmail, hubspot };
}
