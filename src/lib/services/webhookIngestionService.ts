import prisma from "@/lib/db";
import { runIntakeExtraction } from "@/lib/services/aiIntakeService";
import { logAuditEvent } from "@/lib/services/auditService";
import { createCase } from "@/lib/services/caseService";
import { ingestEmail } from "@/lib/services/emailIngestionService";
import { ingestCrmRecord } from "@/lib/services/crmIngestionService";
import { CaseStatus, Prisma } from "@/generated/prisma/client";

function shouldAutoExtract(): boolean {
  return process.env.AUTO_EXTRACT_ON_INGEST !== "false";
}

export type WebhookSource = "generic" | "hubspot" | "salesforce" | "zoho" | "email" | "crm";

export interface WebhookPayload {
  source?: WebhookSource | string;
  case_id?: string;
  case_number?: string;
  create_case?: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  company_country?: string;
  email?: {
    from?: string;
    subject?: string;
    body?: string;
    received_at?: string;
  };
  crm?: {
    name?: string;
    external_record_id?: string;
    data?: Record<string, unknown>;
  };
  notes?: string;
  [key: string]: unknown;
}

export interface WebhookIngestionResult {
  success: boolean;
  caseId?: string;
  caseNumber?: string;
  error?: string;
  actions?: string[];
}

function verifyWebhookSecret(providedSecret?: string | null): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return true; // MVP: allow if not configured
  return providedSecret === expected;
}

/**
 * Process generic webhook payload for case creation or update.
 * Future: dedicated endpoints per CRM with signature validation.
 */
export async function processWebhookIngestion(
  payload: WebhookPayload,
  options?: { secret?: string | null },
): Promise<WebhookIngestionResult> {
  if (!verifyWebhookSecret(options?.secret)) {
    return { success: false, error: "Invalid webhook secret" };
  }

  const actions: string[] = [];
  let caseId = payload.case_id;
  let caseNumber = payload.case_number;

  // Resolve case by number if ID not provided
  if (!caseId && caseNumber) {
    const found = await prisma.case.findUnique({
      where: { caseNumber },
      select: { id: true, caseNumber: true },
    });
    if (found) {
      caseId = found.id;
      caseNumber = found.caseNumber;
    }
  }

  // Create new case if requested and no case found
  if (!caseId && payload.create_case !== false) {
    const newCase = await createCase({
      contactName: payload.contact_name,
      contactEmail: payload.contact_email,
      contactPhone: payload.contact_phone,
      companyName: payload.company_name,
      companyCountry: payload.company_country,
      manualNotes: payload.notes,
    });
    caseId = newCase.id;
    caseNumber = newCase.caseNumber;
    actions.push("case_created");
  }

  if (!caseId) {
    return {
      success: false,
      error: "No case_id or case_number provided, and create_case is disabled",
    };
  }

  // Email block in webhook
  if (payload.email?.body) {
    const emailResult = await ingestEmail({
      caseId,
      fromEmail: payload.email.from,
      subject: payload.email.subject,
      bodyText: payload.email.body,
      receivedAt: payload.email.received_at
        ? new Date(payload.email.received_at)
        : undefined,
    });
    if (emailResult.success) actions.push("email_ingested");
  }

  // CRM block in webhook
  if (payload.crm?.data) {
    const crmResult = await ingestCrmRecord({
      caseId,
      crmName: payload.crm.name ?? payload.source ?? "generic",
      externalRecordId: payload.crm.external_record_id,
      payload: payload.crm.data,
    });
    if (crmResult.success) actions.push("crm_ingested");
  }

  // Flat CRM-style payload (no nested crm object)
  if (!payload.crm && payload.source && payload.source !== "email") {
    const { case_id, case_number, create_case, email, crm, notes, source, ...rest } =
      payload;
    if (Object.keys(rest).length > 0) {
      await ingestCrmRecord({
        caseId,
        crmName: String(source),
        payload: rest as Record<string, unknown>,
      });
      actions.push("crm_ingested");
    }
  }

  if (payload.notes && caseId) {
    await prisma.internalNote.create({
      data: {
        caseId,
        note: payload.notes,
        createdByName: "Webhook",
      },
    });
    actions.push("note_added");
  }

  await logAuditEvent({
    caseId,
    userName: "Webhook",
    action: "CRM_RECORD_INGESTED",
    newValue: payload.source ?? "webhook",
    metadata: { actions, payload: sanitizePayloadForLog(payload) },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: CaseStatus.INTAKE_RECEIVED },
  });

  if (shouldAutoExtract() && actions.length > 0) {
    const extraction = await runIntakeExtraction({
      caseId,
      userName: "Webhook",
    });
    if (extraction.success) {
      actions.push("ai_extraction_completed");
    } else if (extraction.error) {
      actions.push(`ai_extraction_failed:${extraction.error}`);
    }
  }

  return {
    success: true,
    caseId,
    caseNumber,
    actions,
  };
}

function sanitizePayloadForLog(payload: WebhookPayload): Prisma.InputJsonValue {
  const copy = { ...payload };
  if (copy.email?.body) {
    copy.email = { ...copy.email, body: "[redacted]" };
  }
  return copy as Prisma.InputJsonValue;
}
