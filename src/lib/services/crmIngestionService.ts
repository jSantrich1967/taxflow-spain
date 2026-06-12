import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import { CaseStatus, Prisma } from "@/generated/prisma/client";

export interface CrmIngestionInput {
  caseId: string;
  crmName: string;
  externalRecordId?: string;
  payload: Record<string, unknown> | string;
  userName?: string;
}

export interface CrmIngestionResult {
  success: boolean;
  logId?: string;
  error?: string;
}

const SUPPORTED_CRMS = [
  "manual_import",
  "hubspot",
  "salesforce",
  "zoho",
  "generic",
] as const;

/**
 * Ingest CRM record JSON into an existing case.
 * Future: HubSpot, Salesforce, Zoho direct API integrations.
 */
export async function ingestCrmRecord(
  input: CrmIngestionInput,
): Promise<CrmIngestionResult> {
  const { caseId, crmName, userName = "Analista" } = input;

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    return { success: false, error: "Caso no encontrado" };
  }

  let payloadJson: Prisma.InputJsonValue;
  if (typeof input.payload === "string") {
    try {
      payloadJson = JSON.parse(input.payload) as Prisma.InputJsonValue;
    } catch {
      return { success: false, error: "El JSON del CRM no es válido" };
    }
  } else {
    payloadJson = input.payload as Prisma.InputJsonValue;
  }

  const normalizedCrm = SUPPORTED_CRMS.includes(
    crmName as (typeof SUPPORTED_CRMS)[number],
  )
    ? crmName
    : "generic";

  const log = await prisma.crmIngestionLog.create({
    data: {
      caseId,
      crmName: normalizedCrm,
      externalRecordId: input.externalRecordId ?? null,
      payloadJson,
      processed: false,
    },
  });

  // Map common CRM fields to case contact fields when present
  const payload = payloadJson as Record<string, unknown>;
  const contactName =
    (payload.contact_name as string) ??
    (payload.contactName as string) ??
    (payload.name as string);
  const contactEmail =
    (payload.contact_email as string) ?? (payload.email as string);
  const companyName =
    (payload.company_name as string) ??
    (payload.companyName as string) ??
    (payload.company as string);

  await prisma.case.update({
    where: { id: caseId },
    data: {
      contactName: contactName ?? caseRecord.contactName,
      contactEmail: contactEmail ?? caseRecord.contactEmail,
      companyName: companyName ?? caseRecord.companyName,
      status:
        caseRecord.status === CaseStatus.NEW_CLIENT
          ? CaseStatus.INTAKE_RECEIVED
          : caseRecord.status,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "CRM_RECORD_INGESTED",
    newValue: normalizedCrm,
    metadata: {
      logId: log.id,
      externalRecordId: input.externalRecordId,
    },
  });

  return { success: true, logId: log.id };
}

export async function getCrmIngestionLogs(caseId: string) {
  return prisma.crmIngestionLog.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
}

export { SUPPORTED_CRMS };
