import { PageHeader } from "@/components/layout/PageHeader";
import { IntegrationsPanel } from "@/components/integrations/IntegrationsPanel";
import { requireAdmin } from "@/lib/auth/rbac";
import { getIntegrationsStatus } from "@/lib/services/integrationAccountService";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  await requireAdmin();
  const status = await getIntegrationsStatus();
  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="Integraciones"
        description="Conecta Gmail y HubSpot: el sistema trae los datos automáticamente y ejecuta la extracción con IA"
      />
      <IntegrationsPanel
        status={{
          gmail: {
            ...status.gmail,
            lastSyncAt: status.gmail.lastSyncAt?.toISOString() ?? null,
          },
          hubspot: {
            ...status.hubspot,
            lastSyncAt: status.hubspot.lastSyncAt?.toISOString() ?? null,
          },
          autoExtractEnabled: status.autoExtractEnabled,
          cronConfigured: status.cronConfigured,
        }}
        flash={{
          connected: params.connected ?? null,
          error: params.error ?? null,
        }}
      />
    </div>
  );
}
