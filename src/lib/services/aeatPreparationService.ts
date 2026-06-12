import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import { validateUploadFile } from "@/lib/services/documentService";
import {
  buildReceiptStorageKey,
  getStorageProvider,
} from "@/lib/storage/storageFactory";
import {
  ApprovalType,
  CaseStatus,
  ChecklistStatus,
  DraftStatus,
  SubmissionType,
} from "@/generated/prisma/client";
import { getLatestModelo030Draft, getLatestModelo036Draft } from "@/lib/services/draftService";

export interface AeatReadinessCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface AeatPreparationStatus {
  caseId: string;
  caseNumber: string;
  caseStatus: string;
  readyForManualSubmission: boolean;
  checks: AeatReadinessCheck[];
  modelo030: {
    required: boolean;
    draftStatus: string | null;
    draftApproved: boolean;
    missingFields: string[];
  };
  modelo036: {
    required: boolean;
    locked: boolean;
    draftStatus: string | null;
    draftApproved: boolean;
    missingFields: string[];
  };
  checklist: {
    total: number;
    completed: number;
    pending: number;
  };
  fields: {
    total: number;
    approved: number;
    pendingReview: number;
  };
  documents: {
    total: number;
    approved: number;
  };
  approvals: {
    modelo030Draft: boolean;
    modelo036Draft: boolean;
  };
  submissionEvidence: Array<{
    id: string;
    submissionType: string;
    receiptNumber: string | null;
    submittedBy: string | null;
    submittedAt: string | null;
    notes: string | null;
  }>;
  manualInstructions: string[];
}

/**
 * Assess whether a case is ready for manual AEAT submission preparation.
 */
export async function getAeatPreparationStatus(
  caseId: string,
): Promise<AeatPreparationStatus | null> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      extractedFields: true,
      checklistItems: true,
      documents: true,
      submissionEvidence: { orderBy: { createdAt: "desc" } },
      approvals: true,
    },
  });

  if (!caseRecord) return null;

  const [draft030, draft036] = await Promise.all([
    getLatestModelo030Draft(caseId),
    getLatestModelo036Draft(caseId),
  ]);

  const modelo030Approved =
    draft030?.record?.status === DraftStatus.APPROVED ||
    caseRecord.approvals.some(
      (a) =>
        a.approvalType === ApprovalType.MODELO_030_DRAFT &&
        a.status === "APPROVED",
    );

  const modelo036Approved =
    draft036?.record?.status === DraftStatus.APPROVED ||
    caseRecord.approvals.some(
      (a) =>
        a.approvalType === ApprovalType.MODELO_036_DRAFT &&
        a.status === "APPROVED",
    );

  const fieldsApproved = caseRecord.extractedFields.filter(
    (f) => f.analystApproved,
  ).length;
  const fieldsPending = caseRecord.extractedFields.filter(
    (f) => f.requiresHumanReview && !f.analystApproved,
  ).length;

  const checklistCompleted = caseRecord.checklistItems.filter(
    (c) =>
      c.status === ChecklistStatus.APPROVED ||
      c.status === ChecklistStatus.UPLOADED ||
      c.status === ChecklistStatus.AI_PROCESSED,
  ).length;
  const checklistPending = caseRecord.checklistItems.filter(
    (c) => c.status === ChecklistStatus.PENDING,
  ).length;

  const docsApproved = caseRecord.documents.filter(
    (d) => d.status === "APPROVED",
  ).length;

  const checks: AeatReadinessCheck[] = [];

  if (caseRecord.requiresModelo030) {
    checks.push({
      label: "Borrador Modelo 030 aprobado",
      passed: modelo030Approved,
      detail: modelo030Approved
        ? "El borrador interno Modelo 030 tiene aprobación humana"
        : "Aprueba el borrador Modelo 030 antes de la preparación AEAT",
    });
    checks.push({
      label: "Borrador Modelo 030 completo",
      passed: (draft030?.draft?.missingFields.length ?? 1) === 0,
      detail: `${draft030?.draft?.missingFields.length ?? "N/A"} campo(s) faltantes`,
    });
  }

  if (caseRecord.requiresModelo036) {
    checks.push({
      label: "Modelo 036 desbloqueado",
      passed: !caseRecord.modelo036Locked,
      detail: caseRecord.modelo036Locked
        ? "Se requiere NIF M antes del Modelo 036"
        : "Modelo 036 desbloqueado",
    });
    checks.push({
      label: "Borrador Modelo 036 aprobado",
      passed: modelo036Approved,
      detail: modelo036Approved
        ? "El borrador interno Modelo 036 tiene aprobación humana"
        : "Aprueba el borrador Modelo 036 antes de la preparación AEAT",
    });
  }

  checks.push({
    label: "Campos de IA revisados",
    passed: fieldsPending === 0,
    detail: `${fieldsPending} campo(s) pendientes de revisión por analista`,
  });

  checks.push({
    label: "Elementos de checklist resueltos",
    passed: checklistPending === 0,
    detail: `${checklistPending} elemento(s) de checklist siguen pendientes`,
  });

  const readyForManualSubmission = checks.every((c) => c.passed);

  const manualInstructions: string[] = [
    "IMPORTANTE: TaxFlow Spain NO envía formularios a AEAT automáticamente.",
    "Usa los borradores internos aprobados solo como referencia; verifica cada campo manualmente.",
    "Accede a la sede electrónica de AEAT con credenciales autorizadas.",
  ];

  if (caseRecord.requiresModelo030) {
    manualInstructions.push(
      "Modelo 030: envía vía AEAT para NIF M (persona extranjera sin DNI/NIE).",
      "Conserva el justificante de AEAT y súbelo abajo como evidencia de envío.",
    );
  }
  if (caseRecord.requiresModelo036) {
    manualInstructions.push(
      "Modelo 036: envía vía AEAT para alta censal de empresa / IVA.",
      "Asegúrate de que el NIF M ya esté asignado al director extranjero si aplica.",
    );
  }
  if (caseRecord.vatReviewRequired) {
    manualInstructions.push(
      "Completa la sección de IVA con cuidado; verifica establecimiento permanente y actividad en España.",
    );
  }
  if (caseRecord.roiReviewRequired) {
    manualInstructions.push(
      "Verifica los requisitos de registro ROI / VIES para actividad B2B intracomunitaria.",
    );
  }

  return {
    caseId,
    caseNumber: caseRecord.caseNumber,
    caseStatus: caseRecord.status,
    readyForManualSubmission,
    checks,
    modelo030: {
      required: caseRecord.requiresModelo030,
      draftStatus: draft030?.record?.status ?? null,
      draftApproved: modelo030Approved,
      missingFields: draft030?.draft?.missingFields ?? [],
    },
    modelo036: {
      required: caseRecord.requiresModelo036,
      locked: caseRecord.modelo036Locked,
      draftStatus: draft036?.record?.status ?? null,
      draftApproved: modelo036Approved,
      missingFields: draft036?.draft?.missingFields ?? [],
    },
    checklist: {
      total: caseRecord.checklistItems.length,
      completed: checklistCompleted,
      pending: checklistPending,
    },
    fields: {
      total: caseRecord.extractedFields.length,
      approved: fieldsApproved,
      pendingReview: fieldsPending,
    },
    documents: {
      total: caseRecord.documents.length,
      approved: docsApproved,
    },
    approvals: {
      modelo030Draft: modelo030Approved,
      modelo036Draft: modelo036Approved,
    },
    submissionEvidence: caseRecord.submissionEvidence.map((e) => ({
      id: e.id,
      submissionType: e.submissionType,
      receiptNumber: e.receiptNumber,
      submittedBy: e.submittedBy,
      submittedAt: e.submittedAt?.toISOString() ?? null,
      notes: e.notes,
    })),
    manualInstructions,
  };
}

export interface RecordSubmissionInput {
  caseId: string;
  caseNumber: string;
  submissionType: SubmissionType;
  receiptNumber?: string;
  submittedBy?: string;
  submittedAt?: Date;
  notes?: string;
  receiptFile?: File;
}

/**
 * Record manual AEAT submission evidence (receipt upload + metadata).
 * Does NOT submit anything to AEAT.
 */
export async function recordSubmissionEvidence(
  input: RecordSubmissionInput,
): Promise<{ success: boolean; error?: string; evidenceId?: string }> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: input.caseId },
  });
  if (!caseRecord) return { success: false, error: "Caso no encontrado" };

  let receiptFilePath: string | null = null;

  if (input.receiptFile && input.receiptFile.size > 0) {
    const validationError = validateUploadFile(input.receiptFile);
    if (validationError) return { success: false, error: validationError };

    const storage = getStorageProvider();
    const safeName = input.receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}_${safeName}`;
    const storageKey = buildReceiptStorageKey(input.caseNumber, storedName);

    const buffer = Buffer.from(await input.receiptFile.arrayBuffer());
    const stored = await storage.put(storageKey, buffer, {
      contentType: input.receiptFile.type || undefined,
    });

    receiptFilePath = stored.absolutePath ?? storage.resolvePath(storageKey);
  }

  const evidence = await prisma.submissionEvidence.create({
    data: {
      caseId: input.caseId,
      submissionType: input.submissionType,
      receiptFilePath,
      receiptNumber: input.receiptNumber ?? null,
      submittedBy: input.submittedBy ?? "Analista",
      submittedAt: input.submittedAt ?? new Date(),
      notes: input.notes ?? null,
    },
  });

  const statusMap: Partial<Record<SubmissionType, CaseStatus>> = {
    MODELO_030: CaseStatus.MODELO_030_SUBMITTED,
    MODELO_036: CaseStatus.VAT_ROI_SUBMITTED,
    VAT: CaseStatus.VAT_ROI_SUBMITTED,
    ROI_VIES: CaseStatus.VAT_ROI_SUBMITTED,
  };

  const newStatus = statusMap[input.submissionType];
  if (newStatus) {
    await prisma.case.update({
      where: { id: input.caseId },
      data: { status: newStatus },
    });
  }

  await logAuditEvent({
    caseId: input.caseId,
    userName: input.submittedBy ?? "Analista",
    action: "RECEIPT_UPLOADED",
    newValue: input.receiptNumber ?? input.submissionType,
    metadata: { evidenceId: evidence.id, submissionType: input.submissionType },
  });

  await logAuditEvent({
    caseId: input.caseId,
    userName: input.submittedBy ?? "Analista",
    action: "AEAT_PREPARATION_COMPLETED",
    newValue: "Evidence recorded — manual submission",
    metadata: { evidenceId: evidence.id },
  });

  return { success: true, evidenceId: evidence.id };
}

export async function markAeatPreparationReviewed(
  caseId: string,
  userName = "Analista",
) {
  await logAuditEvent({
    caseId,
    userName,
    action: "AEAT_PREPARATION_COMPLETED",
    newValue: "Preparation checklist reviewed",
  });
  return { success: true };
}
