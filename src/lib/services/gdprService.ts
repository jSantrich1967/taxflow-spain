import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";

const REDACTED = "[REDACTED]";
const DEFAULT_RETENTION_DAYS = Number(process.env.DATA_RETENTION_DAYS ?? 2555);

export interface GdprExportBundle {
  exportedAt: string;
  caseId: string;
  caseNumber: string;
  case: Record<string, unknown>;
  director: Record<string, unknown> | null;
  company: Record<string, unknown> | null;
  documents: Record<string, unknown>[];
  extractedFields: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
}

export function getRetentionPolicy() {
  return {
    retentionDays: DEFAULT_RETENTION_DAYS,
    description:
      "Cases are retained for compliance review. Configure DATA_RETENTION_DAYS in production.",
    supportsExport: true,
    supportsAnonymization: true,
  };
}

export async function exportCaseData(caseId: string): Promise<GdprExportBundle> {
  const taxCase = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      director: true,
      company: true,
      documents: true,
      extractedFields: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    caseId: taxCase.id,
    caseNumber: taxCase.caseNumber,
    case: taxCase as unknown as Record<string, unknown>,
    director: (taxCase.director as unknown as Record<string, unknown>) ?? null,
    company: (taxCase.company as unknown as Record<string, unknown>) ?? null,
    documents: taxCase.documents as unknown as Record<string, unknown>[],
    extractedFields:
      taxCase.extractedFields as unknown as Record<string, unknown>[],
    auditLogs: taxCase.auditLogs as unknown as Record<string, unknown>[],
  };
}

/**
 * Anonymize personal data while keeping audit trail structure for compliance.
 */
export async function anonymizeCaseData(
  caseId: string,
  actorName: string,
): Promise<{ success: boolean; error?: string }> {
  const taxCase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!taxCase) {
    return { success: false, error: "Caso no encontrado" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        contactName: REDACTED,
        contactEmail: `redacted-${caseId.slice(0, 8)}@anonymized.local`,
        contactPhone: REDACTED,
        companyName: taxCase.companyName ? REDACTED : null,
        assignedAnalyst: taxCase.assignedAnalyst ? REDACTED : null,
      },
    });

    await tx.director.updateMany({
      where: { caseId },
      data: {
        fullName: REDACTED,
        firstName: REDACTED,
        lastName1: REDACTED,
        lastName2: null,
        passportNumber: REDACTED,
        foreignTaxId: REDACTED,
        address: REDACTED,
        city: REDACTED,
        postalCode: REDACTED,
        nifMNumber: REDACTED,
      },
    });

    await tx.company.updateMany({
      where: { caseId },
      data: {
        legalName: REDACTED,
        tradingName: null,
        registrationNumber: REDACTED,
        vatNumber: REDACTED,
        registeredAddress: REDACTED,
      },
    });

    await tx.extractedField.updateMany({
      where: { caseId },
      data: {
        value: REDACTED,
        analystCorrectedValue: REDACTED,
        sourceExcerpt: REDACTED,
      },
    });
  });

  await logAuditEvent({
    caseId,
    userName: actorName,
    action: "GDPR_ANONYMIZATION",
    newValue: "Datos personales del caso anonimizados",
  });

  return { success: true };
}

export async function listCasesEligibleForRetentionReview() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEFAULT_RETENTION_DAYS);

  return prisma.case.findMany({
    where: {
      updatedAt: { lt: cutoff },
      status: { in: ["COMPLETED", "ON_HOLD", "REJECTED"] },
    },
    select: {
      id: true,
      caseNumber: true,
      updatedAt: true,
      status: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });
}
