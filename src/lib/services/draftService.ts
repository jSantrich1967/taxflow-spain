import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import { validateExtractionOutput } from "@/lib/services/openaiExtractionService";
import { dbExtractedFieldsToAutofill } from "@/lib/services/fieldAutofillService";
import {
  mapToModelo030Draft,
  updateDraftFieldValue,
  refreshDraftCompleteness,
} from "@/lib/services/modelo030MappingService";
import {
  mapToModelo036Draft,
  updateDraftFieldValue036,
  refreshDraftCompleteness036,
} from "@/lib/services/modelo036MappingService";
import { AiExtractionOutput } from "@/lib/schemas/aiExtractionSchema";
import { Modelo030Draft, Modelo036Draft } from "@/lib/types";
import {
  ApprovalStatus,
  ApprovalType,
  CaseStatus,
  DraftStatus,
  HumanReviewStatus,
  Prisma,
} from "@/generated/prisma/client";

async function loadCaseForDraft(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      extractedFields: true,
      aiRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      modelo030Drafts: { orderBy: { generatedAt: "desc" }, take: 1 },
      modelo036Drafts: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });
}

function getExtractionForCase(
  aiRunOutput: unknown,
): AiExtractionOutput | null {
  if (!aiRunOutput) return null;
  return validateExtractionOutput(aiRunOutput);
}

function parseDraftJson<T>(json: unknown): T | null {
  if (!json || typeof json !== "object") return null;
  return json as T;
}

function toHumanReviewStatus(
  status: string,
): HumanReviewStatus {
  const map: Record<string, HumanReviewStatus> = {
    NOT_STARTED: HumanReviewStatus.NOT_STARTED,
    IN_PROGRESS: HumanReviewStatus.IN_PROGRESS,
    COMPLETED: HumanReviewStatus.COMPLETED,
    REQUIRES_SUPERVISOR: HumanReviewStatus.REQUIRES_SUPERVISOR,
  };
  return map[status] ?? HumanReviewStatus.NOT_STARTED;
}

async function persistModelo030Draft(caseId: string, draft: Modelo030Draft) {
  const record = await prisma.modelo030Draft.create({
    data: {
      caseId,
      draftJson: draft as unknown as Prisma.InputJsonValue,
      status: DraftStatus.READY_FOR_REVIEW,
      warningsJson: draft.warnings as Prisma.InputJsonValue,
      missingFieldsJson: draft.missingFields as Prisma.InputJsonValue,
      sourceReferencesJson: draft.sourceReferences as unknown as Prisma.InputJsonValue,
      humanReviewStatus: toHumanReviewStatus(draft.humanReviewStatus),
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: CaseStatus.MODELO_030_DRAFT_READY },
  });

  await logAuditEvent({
    caseId,
    action: "MODELO_030_DRAFT_GENERATED",
    newValue: String(draft.missingFields.length) + " missing",
    metadata: {
      draftId: record.id,
      missingFields: draft.missingFields,
    },
  });

  return record;
}

async function persistModelo036Draft(caseId: string, draft: Modelo036Draft) {
  const record = await prisma.modelo036Draft.create({
    data: {
      caseId,
      draftJson: draft as unknown as Prisma.InputJsonValue,
      status: DraftStatus.READY_FOR_REVIEW,
      warningsJson: draft.warnings as Prisma.InputJsonValue,
      missingFieldsJson: draft.missingFields as Prisma.InputJsonValue,
      sourceReferencesJson: draft.sourceReferences as unknown as Prisma.InputJsonValue,
      humanReviewStatus: toHumanReviewStatus(draft.humanReviewStatus),
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: CaseStatus.MODELO_036_DRAFT_READY },
  });

  await logAuditEvent({
    caseId,
    action: "MODELO_036_DRAFT_GENERATED",
    newValue: String(draft.missingFields.length) + " missing",
    metadata: {
      draftId: record.id,
      missingFields: draft.missingFields,
    },
  });

  return record;
}

export async function generateModelo030Draft(caseId: string) {
  const caseRecord = await loadCaseForDraft(caseId);
  if (!caseRecord) return { success: false, error: "Caso no encontrado" };

  if (!caseRecord.requiresModelo030) {
    return {
      success: false,
      error: "This case does not require Modelo 030 based on classification.",
    };
  }

  const extraction = getExtractionForCase(caseRecord.aiRuns[0]?.structuredOutput);
  if (!extraction) {
    return {
      success: false,
      error: "No AI extraction available. Run AI extraction first.",
    };
  }

  const autofillFields = dbExtractedFieldsToAutofill(caseRecord.extractedFields);
  const draft = mapToModelo030Draft(extraction, autofillFields);
  const record = await persistModelo030Draft(caseId, draft);

  return { success: true, draftId: record.id, draft };
}

export async function generateModelo036Draft(caseId: string) {
  const caseRecord = await loadCaseForDraft(caseId);
  if (!caseRecord) return { success: false, error: "Caso no encontrado" };

  if (caseRecord.modelo036Locked) {
    return {
      success: false,
      error: "Modelo 036 is locked until NIF M is received for the foreign director.",
    };
  }

  if (!caseRecord.requiresModelo036) {
    return {
      success: false,
      error: "This case does not require Modelo 036 based on classification.",
    };
  }

  const extraction = getExtractionForCase(caseRecord.aiRuns[0]?.structuredOutput);
  if (!extraction) {
    return {
      success: false,
      error: "No AI extraction available. Run AI extraction first.",
    };
  }

  const autofillFields = dbExtractedFieldsToAutofill(caseRecord.extractedFields);
  const draft = mapToModelo036Draft(extraction, autofillFields, {
    modelo036Locked: caseRecord.modelo036Locked,
  });
  const record = await persistModelo036Draft(caseId, draft);

  return { success: true, draftId: record.id, draft };
}

export async function getLatestModelo030Draft(caseId: string) {
  const record = await prisma.modelo030Draft.findFirst({
    where: { caseId },
    orderBy: { generatedAt: "desc" },
  });
  if (!record) return null;

  const draft = parseDraftJson<Modelo030Draft>(record.draftJson);
  return { record, draft };
}

export async function getLatestModelo036Draft(caseId: string) {
  const record = await prisma.modelo036Draft.findFirst({
    where: { caseId },
    orderBy: { generatedAt: "desc" },
  });
  if (!record) return null;

  const draft = parseDraftJson<Modelo036Draft>(record.draftJson);
  return { record, draft };
}

export async function updateModelo030DraftField(
  caseId: string,
  draftId: string,
  fieldKey: string,
  value: string,
  userName = "Analista",
) {
  const record = await prisma.modelo030Draft.findFirst({
    where: { id: draftId, caseId },
  });
  if (!record) return { success: false, error: "Borrador no encontrado" };

  const draft = parseDraftJson<Modelo030Draft>(record.draftJson);
  if (!draft) return { success: false, error: "Datos de borrador inválidos" };

  const updated = updateDraftFieldValue(draft, fieldKey, value);

  await prisma.modelo030Draft.update({
    where: { id: draftId },
    data: {
      draftJson: updated as unknown as Prisma.InputJsonValue,
      missingFieldsJson: updated.missingFields,
      humanReviewStatus: toHumanReviewStatus(updated.humanReviewStatus),
      status: DraftStatus.DRAFT,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "FIELD_CORRECTED",
    newValue: fieldKey,
    metadata: { draftType: "MODELO_030", value },
  });

  return { success: true, draft: updated };
}

export async function updateModelo036DraftField(
  caseId: string,
  draftId: string,
  fieldKey: string,
  value: string,
  userName = "Analista",
) {
  const record = await prisma.modelo036Draft.findFirst({
    where: { id: draftId, caseId },
  });
  if (!record) return { success: false, error: "Borrador no encontrado" };

  const draft = parseDraftJson<Modelo036Draft>(record.draftJson);
  if (!draft) return { success: false, error: "Datos de borrador inválidos" };

  const updated = updateDraftFieldValue036(draft, fieldKey, value);

  await prisma.modelo036Draft.update({
    where: { id: draftId },
    data: {
      draftJson: updated as unknown as Prisma.InputJsonValue,
      missingFieldsJson: updated.missingFields,
      humanReviewStatus: toHumanReviewStatus(updated.humanReviewStatus),
      status: DraftStatus.DRAFT,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "FIELD_CORRECTED",
    newValue: fieldKey,
    metadata: { draftType: "MODELO_036", value },
  });

  return { success: true, draft: updated };
}

export async function approveModelo030Draft(
  caseId: string,
  draftId: string,
  userName = "Analista",
  notes?: string,
) {
  const record = await prisma.modelo030Draft.findFirst({
    where: { id: draftId, caseId },
  });
  if (!record) return { success: false, error: "Borrador no encontrado" };

  const draft = parseDraftJson<Modelo030Draft>(record.draftJson);
  if (!draft) return { success: false, error: "Datos de borrador inválidos" };

  const refreshed = refreshDraftCompleteness(draft);

  if (refreshed.missingFields.length > 0) {
    return {
      success: false,
      error: `No se puede aprobar: aún faltan ${refreshed.missingFields.length} campo(s) obligatorio(s).`,
      missingFields: refreshed.missingFields,
    };
  }

  await prisma.modelo030Draft.update({
    where: { id: draftId },
    data: {
      status: DraftStatus.APPROVED,
      humanReviewStatus: HumanReviewStatus.COMPLETED,
      approvedAt: new Date(),
      approvedBy: userName,
      missingFieldsJson: refreshed.missingFields,
    },
  });

  await prisma.approval.create({
    data: {
      caseId,
      approvalType: ApprovalType.MODELO_030_DRAFT,
      approvedBy: userName,
      status: ApprovalStatus.APPROVED,
      notes: notes ?? null,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: CaseStatus.MODELO_030_APPROVED },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "HUMAN_APPROVAL_COMPLETED",
    newValue: "MODELO_030_DRAFT",
    metadata: { draftId, notes },
  });

  return { success: true };
}

export async function approveModelo036Draft(
  caseId: string,
  draftId: string,
  userName = "Analista",
  notes?: string,
) {
  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (caseRecord?.modelo036Locked) {
    return {
      success: false,
      error: "El Modelo 036 está bloqueado hasta recibir el NIF M.",
    };
  }

  const record = await prisma.modelo036Draft.findFirst({
    where: { id: draftId, caseId },
  });
  if (!record) return { success: false, error: "Borrador no encontrado" };

  const draft = parseDraftJson<Modelo036Draft>(record.draftJson);
  if (!draft) return { success: false, error: "Datos de borrador inválidos" };

  const refreshed = refreshDraftCompleteness036(draft);

  if (refreshed.missingFields.length > 0) {
    return {
      success: false,
      error: `No se puede aprobar: aún faltan ${refreshed.missingFields.length} campo(s) obligatorio(s).`,
      missingFields: refreshed.missingFields,
    };
  }

  await prisma.modelo036Draft.update({
    where: { id: draftId },
    data: {
      status: DraftStatus.APPROVED,
      humanReviewStatus: HumanReviewStatus.COMPLETED,
      approvedAt: new Date(),
      approvedBy: userName,
      missingFieldsJson: refreshed.missingFields,
    },
  });

  await prisma.approval.create({
    data: {
      caseId,
      approvalType: ApprovalType.MODELO_036_DRAFT,
      approvedBy: userName,
      status: ApprovalStatus.APPROVED,
      notes: notes ?? null,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: CaseStatus.MODELO_036_APPROVED },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "HUMAN_APPROVAL_COMPLETED",
    newValue: "MODELO_036_DRAFT",
    metadata: { draftId, notes },
  });

  return { success: true };
}

export async function markNifMReceived(caseId: string, nifMNumber: string, userName = "Analista") {
  await prisma.case.update({
    where: { id: caseId },
    data: {
      nifMReceived: true,
      modelo036Locked: false,
      status: CaseStatus.NIF_M_RECEIVED,
    },
  });

  await prisma.director.updateMany({
    where: { caseId },
    data: { nifMNumber },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "NIF_M_MARKED_RECEIVED",
    newValue: nifMNumber,
  });

  return { success: true };
}
