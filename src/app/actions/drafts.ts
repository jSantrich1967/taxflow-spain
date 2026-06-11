"use server";

import { revalidatePath } from "next/cache";
import { requireSupervisorOrAdmin } from "@/lib/auth/rbac";
import { getActorName } from "@/lib/auth/session";
import {
  generateModelo030Draft,
  generateModelo036Draft,
  updateModelo030DraftField,
  updateModelo036DraftField,
  approveModelo030Draft,
  approveModelo036Draft,
  markNifMReceived,
} from "@/lib/services/draftService";

function revalidateDraftPaths(caseId: string, type: "030" | "036") {
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/review`);
  if (type === "030") {
    revalidatePath(`/cases/${caseId}/modelo-030-draft`);
  } else {
    revalidatePath(`/cases/${caseId}/modelo-036-draft`);
  }
}

export async function generateModelo030DraftAction(caseId: string) {
  const result = await generateModelo030Draft(caseId);
  if (result.success) revalidateDraftPaths(caseId, "030");
  return result;
}

export async function generateModelo036DraftAction(caseId: string) {
  const result = await generateModelo036Draft(caseId);
  if (result.success) revalidateDraftPaths(caseId, "036");
  return result;
}

export async function updateModelo030FieldAction(
  caseId: string,
  draftId: string,
  fieldKey: string,
  value: string,
) {
  const result = await updateModelo030DraftField(caseId, draftId, fieldKey, value);
  if (result.success) revalidateDraftPaths(caseId, "030");
  return result;
}

export async function updateModelo036FieldAction(
  caseId: string,
  draftId: string,
  fieldKey: string,
  value: string,
) {
  const result = await updateModelo036DraftField(caseId, draftId, fieldKey, value);
  if (result.success) revalidateDraftPaths(caseId, "036");
  return result;
}

export async function approveModelo030DraftAction(
  caseId: string,
  draftId: string,
  notes?: string,
) {
  await requireSupervisorOrAdmin();
  const actor = await getActorName();
  const result = await approveModelo030Draft(caseId, draftId, actor, notes);
  if (result.success) revalidateDraftPaths(caseId, "030");
  return result;
}

export async function approveModelo036DraftAction(
  caseId: string,
  draftId: string,
  notes?: string,
) {
  await requireSupervisorOrAdmin();
  const actor = await getActorName();
  const result = await approveModelo036Draft(caseId, draftId, actor, notes);
  if (result.success) revalidateDraftPaths(caseId, "036");
  return result;
}

export async function markNifMReceivedAction(
  caseId: string,
  nifMNumber: string,
) {
  const result = await markNifMReceived(caseId, nifMNumber);
  if (result.success) {
    revalidatePath(`/cases/${caseId}`);
    revalidatePath(`/cases/${caseId}/modelo-036-draft`);
  }
  return result;
}
