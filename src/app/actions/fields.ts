"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";

export async function updateFieldAction(
  fieldId: string,
  caseId: string,
  correctedValue: string,
  userName = "Analista",
) {
  const field = await prisma.extractedField.findUnique({
    where: { id: fieldId },
  });

  if (!field || field.caseId !== caseId) {
    return { success: false, error: "Campo no encontrado" };
  }

  await prisma.extractedField.update({
    where: { id: fieldId },
    data: {
      analystCorrectedValue: correctedValue.trim() || null,
      analystApproved: false,
      approvedBy: null,
      approvedAt: null,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "FIELD_CORRECTED",
    previousValue: field.value,
    newValue: correctedValue,
    metadata: { fieldKey: field.fieldKey },
  });

  revalidatePath(`/cases/${caseId}/review`);
  revalidatePath(`/cases/${caseId}`);

  return { success: true };
}

export async function approveFieldAction(
  fieldId: string,
  caseId: string,
  userName = "Analista",
) {
  const field = await prisma.extractedField.findUnique({
    where: { id: fieldId },
  });

  if (!field || field.caseId !== caseId) {
    return { success: false, error: "Campo no encontrado" };
  }

  await prisma.extractedField.update({
    where: { id: fieldId },
    data: {
      analystApproved: true,
      approvedBy: userName,
      approvedAt: new Date(),
      requiresHumanReview: false,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "FIELD_APPROVED",
    newValue: field.fieldKey,
    metadata: {
      effectiveValue: field.analystCorrectedValue ?? field.value,
    },
  });

  revalidatePath(`/cases/${caseId}/review`);
  revalidatePath(`/cases/${caseId}`);

  return { success: true };
}

export async function rejectFieldAction(
  fieldId: string,
  caseId: string,
  userName = "Analista",
) {
  const field = await prisma.extractedField.findUnique({
    where: { id: fieldId },
  });

  if (!field || field.caseId !== caseId) {
    return { success: false, error: "Campo no encontrado" };
  }

  await prisma.extractedField.update({
    where: { id: fieldId },
    data: {
      analystApproved: false,
      approvedBy: null,
      approvedAt: null,
      requiresHumanReview: true,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "FIELD_REJECTED",
    newValue: field.fieldKey,
  });

  revalidatePath(`/cases/${caseId}/review`);

  return { success: true };
}
