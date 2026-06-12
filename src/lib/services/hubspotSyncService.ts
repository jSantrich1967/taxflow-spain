import prisma from "@/lib/db";
import { runIntakeExtraction } from "@/lib/services/aiIntakeService";
import { createCase } from "@/lib/services/caseService";
import { ingestCrmRecord } from "@/lib/services/crmIngestionService";
import {
  getIntegrationAccount,
  isExternalRecordProcessed,
  markExternalRecordProcessed,
  upsertIntegrationAccount,
} from "@/lib/services/integrationAccountService";

export interface HubSpotSyncResult {
  success: boolean;
  processed: number;
  createdCases: number;
  errors: string[];
}

interface HubSpotContact {
  id: string;
  properties: Record<string, string | null | undefined>;
}

function shouldAutoExtract(): boolean {
  return process.env.AUTO_EXTRACT_ON_INGEST !== "false";
}

async function getHubSpotAccessToken(): Promise<string | null> {
  const account = await getIntegrationAccount("HUBSPOT");
  return account?.accessToken ?? process.env.HUBSPOT_ACCESS_TOKEN ?? null;
}

export async function syncHubSpotContacts(): Promise<HubSpotSyncResult> {
  const result: HubSpotSyncResult = {
    success: true,
    processed: 0,
    createdCases: 0,
    errors: [],
  };

  const token = await getHubSpotAccessToken();
  if (!token) {
    return {
      success: false,
      processed: 0,
      createdCases: 0,
      errors: ["El token de acceso de HubSpot no está configurado"],
    };
  }

  try {
    const properties = [
      "email",
      "firstname",
      "lastname",
      "phone",
      "company",
      "country",
      "hs_object_id",
    ].join(",");

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts?limit=50&properties=${properties}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { results?: HubSpotContact[] };
    const contacts = data.results ?? [];

    for (const contact of contacts) {
      const externalId = contact.id;
      if (await isExternalRecordProcessed("hubspot", externalId)) {
        continue;
      }

      try {
        const props = contact.properties;
        const email = props.email?.toLowerCase();
        const fullName = [props.firstname, props.lastname]
          .filter(Boolean)
          .join(" ")
          .trim();

        let caseRecord = email
          ? await prisma.case.findFirst({
              where: { contactEmail: email },
              orderBy: { updatedAt: "desc" },
            })
          : null;

        if (!caseRecord) {
          caseRecord = await createCase({
            contactName: fullName || undefined,
            contactEmail: email,
            contactPhone: props.phone ?? undefined,
            companyName: props.company ?? undefined,
            companyCountry: props.country ?? undefined,
            manualNotes: `Creado automáticamente desde el contacto de HubSpot ${externalId}`,
          });
          result.createdCases += 1;
        }

        await ingestCrmRecord({
          caseId: caseRecord.id,
          crmName: "hubspot",
          externalRecordId: externalId,
          payload: props,
          userName: "HubSpot Sync",
        });

        if (shouldAutoExtract()) {
          const extraction = await runIntakeExtraction({
            caseId: caseRecord.id,
            userName: "HubSpot Sync",
          });
          if (!extraction.success) {
            result.errors.push(
              `Contacto ${externalId}: la extracción falló — ${extraction.error}`,
            );
          }
        }

        await markExternalRecordProcessed("hubspot", externalId, caseRecord.id);
        result.processed += 1;
      } catch (error) {
        result.errors.push(
          `Contacto ${externalId}: ${error instanceof Error ? error.message : "error desconocido"}`,
        );
      }
    }

    await upsertIntegrationAccount("HUBSPOT", {
      isActive: true,
      lastSyncAt: new Date(),
      lastSyncError: result.errors[0] ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "La sincronización de HubSpot falló";
    await upsertIntegrationAccount("HUBSPOT", {
      lastSyncError: message,
    });
    return { success: false, processed: 0, createdCases: 0, errors: [message] };
  }

  return result;
}
