import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import { CaseStatus } from "@/generated/prisma/client";

export interface EmailIngestionInput {
  caseId: string;
  fromEmail?: string;
  subject?: string;
  bodyText: string;
  receivedAt?: Date;
  attachmentsCount?: number;
  userName?: string;
}

export interface EmailIngestionResult {
  success: boolean;
  logId?: string;
  error?: string;
}

/**
 * Ingest pasted or imported email content into an existing case.
 * Future: Gmail API, Microsoft Graph API.
 */
export async function ingestEmail(
  input: EmailIngestionInput,
): Promise<EmailIngestionResult> {
  const { caseId, bodyText, userName = "Analista" } = input;

  if (!bodyText.trim()) {
    return { success: false, error: "El cuerpo del email es obligatorio" };
  }

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    return { success: false, error: "Caso no encontrado" };
  }

  const log = await prisma.emailIngestionLog.create({
    data: {
      caseId,
      fromEmail: input.fromEmail ?? null,
      subject: input.subject ?? null,
      bodySummary: bodyText.slice(0, 2000),
      attachmentsCount: input.attachmentsCount ?? 0,
      receivedAt: input.receivedAt ?? new Date(),
      processed: false,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: {
      status:
        caseRecord.status === CaseStatus.NEW_CLIENT
          ? CaseStatus.INTAKE_RECEIVED
          : caseRecord.status,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "EMAIL_INGESTED",
    newValue: input.subject ?? "Email pegado",
    metadata: { logId: log.id, fromEmail: input.fromEmail },
  });

  return { success: true, logId: log.id };
}

export async function getEmailIngestionLogs(caseId: string) {
  return prisma.emailIngestionLog.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Placeholder for future Gmail API integration.
 */
export async function ingestFromGmail(_caseId: string, _messageId: string) {
  return {
    success: false,
    error: "La integración de Gmail API no está configurada. Usa el pegado manual de email.",
  };
}

/**
 * Placeholder for future Microsoft Graph integration.
 */
export async function ingestFromOutlook(_caseId: string, _messageId: string) {
  return {
    success: false,
    error: "La integración de Microsoft Graph no está configurada. Usa el pegado manual de email.",
  };
}
