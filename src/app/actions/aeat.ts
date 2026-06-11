"use server";

import { revalidatePath } from "next/cache";
import {
  getAeatPreparationStatus,
  recordSubmissionEvidence,
  markAeatPreparationReviewed,
} from "@/lib/services/aeatPreparationService";
import { getCaseById } from "@/lib/services/caseService";
import { SubmissionType } from "@/generated/prisma/client";

export async function getAeatPreparationAction(caseId: string) {
  return getAeatPreparationStatus(caseId);
}

export async function recordSubmissionEvidenceAction(
  caseId: string,
  formData: FormData,
) {
  const caseRecord = await getCaseById(caseId);
  if (!caseRecord) return { success: false, error: "Case not found" };

  const submissionType = String(
    formData.get("submissionType") ?? "MODELO_030",
  ) as SubmissionType;
  const receiptNumber = String(formData.get("receiptNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const submittedBy = String(formData.get("submittedBy") ?? "Analyst").trim();
  const receiptFile = formData.get("receiptFile") as File | null;

  const result = await recordSubmissionEvidence({
    caseId,
    caseNumber: caseRecord.caseNumber,
    submissionType,
    receiptNumber: receiptNumber || undefined,
    notes: notes || undefined,
    submittedBy,
    receiptFile:
      receiptFile && receiptFile.size > 0 ? receiptFile : undefined,
  });

  if (result.success) {
    revalidatePath(`/cases/${caseId}/aeat-preparation`);
    revalidatePath(`/cases/${caseId}`);
  }

  return result;
}

export async function markPreparationReviewedAction(caseId: string) {
  const result = await markAeatPreparationReviewed(caseId);
  revalidatePath(`/cases/${caseId}/aeat-preparation`);
  return result;
}
