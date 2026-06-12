import prisma from "@/lib/db";
import { generateCaseNumber } from "@/lib/utils/caseNumber";
import { logAuditEvent, logStatusChange } from "@/lib/services/auditService";
import { CaseStatus, Prisma } from "@/generated/prisma/client";

export interface CreateCaseInput {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  companyCountry?: string;
  assignedAnalyst?: string;
  emailText?: string;
  emailSubject?: string;
  emailFrom?: string;
  crmJson?: string;
  manualNotes?: string;
}

export async function createCase(input: CreateCaseInput) {
  const caseNumber = await generateCaseNumber();

  const newCase = await prisma.case.create({
    data: {
      caseNumber,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      companyName: input.companyName ?? null,
      companyCountry: input.companyCountry ?? null,
      assignedAnalyst: input.assignedAnalyst ?? "Analista",
      status: CaseStatus.INTAKE_RECEIVED,
    },
  });

  await logAuditEvent({
    caseId: newCase.id,
    userName: input.assignedAnalyst ?? "Analista",
    action: "CASE_CREATED",
    newValue: caseNumber,
    metadata: { contactEmail: input.contactEmail },
  });

  if (input.emailText?.trim()) {
    await prisma.emailIngestionLog.create({
      data: {
        caseId: newCase.id,
        fromEmail: input.emailFrom ?? null,
        subject: input.emailSubject ?? null,
        bodySummary: input.emailText.slice(0, 500),
        attachmentsCount: 0,
        processed: false,
        receivedAt: new Date(),
      },
    });

    await logAuditEvent({
      caseId: newCase.id,
      action: "EMAIL_INGESTED",
      newValue: input.emailSubject ?? "Pegado manual de email",
    });
  }

  if (input.crmJson?.trim()) {
    let payload: Prisma.InputJsonValue = {};
    try {
      payload = JSON.parse(input.crmJson) as Prisma.InputJsonValue;
    } catch {
      payload = { raw: input.crmJson };
    }

    await prisma.crmIngestionLog.create({
      data: {
        caseId: newCase.id,
        crmName: "manual_import",
        payloadJson: payload,
        processed: false,
      },
    });

    await logAuditEvent({
      caseId: newCase.id,
      action: "CRM_RECORD_INGESTED",
      newValue: "manual_import",
    });
  }

  if (input.manualNotes?.trim()) {
    await prisma.internalNote.create({
      data: {
        caseId: newCase.id,
        note: input.manualNotes,
        createdByName: input.assignedAnalyst ?? "Analista",
      },
    });
  }

  return newCase;
}

const REVIEW_QUEUE_STATUSES: CaseStatus[] = [
  CaseStatus.AI_EXTRACTION_COMPLETED,
  CaseStatus.ANALYST_REVIEW,
  CaseStatus.MODELO_030_REQUIRED,
  CaseStatus.MODELO_036_ACTIVE,
  CaseStatus.VAT_ROI_REVIEW,
  CaseStatus.DOCUMENTS_UPLOADED,
];

export async function listCases(options?: {
  status?: CaseStatus;
  reviewQueue?: boolean;
  limit?: number;
}) {
  const where = options?.reviewQueue
    ? { status: { in: REVIEW_QUEUE_STATUSES } }
    : options?.status
      ? { status: options.status }
      : undefined;

  return prisma.case.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
    include: {
      _count: {
        select: {
          documents: true,
          extractedFields: true,
          checklistItems: true,
        },
      },
    },
  });
}

export async function getCaseById(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      director: true,
      company: true,
      representative: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      extractedFields: { orderBy: { fieldKey: "asc" } },
      checklistItems: { orderBy: { category: "asc" } },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 5 },
      emailIngestionLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      crmIngestionLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      internalNotes: { orderBy: { createdAt: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: CaseStatus,
  userName?: string,
) {
  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { status: true },
  });

  if (!existing) throw new Error("Caso no encontrado");

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { status: newStatus },
  });

  await logStatusChange(caseId, existing.status, newStatus, userName);

  return updated;
}

export async function getDashboardStats() {
  const [
    totalCases,
    pendingReview,
    requiresModelo030,
    requiresModelo036,
    vatReview,
    roiReview,
    completed,
    avgConfidence,
    correctedFields,
  ] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: CaseStatus.ANALYST_REVIEW } }),
    prisma.case.count({ where: { requiresModelo030: true } }),
    prisma.case.count({ where: { requiresModelo036: true } }),
    prisma.case.count({ where: { vatReviewRequired: true } }),
    prisma.case.count({ where: { roiReviewRequired: true } }),
    prisma.case.count({ where: { status: CaseStatus.COMPLETED } }),
    prisma.extractedField.aggregate({ _avg: { confidenceScore: true } }),
    prisma.extractedField.count({
      where: { analystCorrectedValue: { not: null } },
    }),
  ]);

  const byStatus = await prisma.case.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return {
    totalCases,
    pendingReview,
    requiresModelo030,
    requiresModelo036,
    vatReview,
    roiReview,
    completed,
    avgConfidence: avgConfidence._avg.confidenceScore ?? 0,
    correctedFields,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
  };
}
