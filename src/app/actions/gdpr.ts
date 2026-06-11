"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/rbac";
import { getActorName } from "@/lib/auth/session";
import {
  anonymizeCaseData,
  exportCaseData,
  getRetentionPolicy,
  listCasesEligibleForRetentionReview,
} from "@/lib/services/gdprService";
import { listProfiles } from "@/lib/services/userService";

export async function exportCaseDataAction(caseId: string) {
  await requireAdmin();
  return exportCaseData(caseId);
}

export async function anonymizeCaseAction(caseId: string) {
  const admin = await requireAdmin();
  const result = await anonymizeCaseData(caseId, admin.name);
  if (result.success) {
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/settings");
  }
  return result;
}

export async function getGdprDashboardDataAction() {
  await requireAdmin();
  const [policy, retentionCandidates, users] = await Promise.all([
    Promise.resolve(getRetentionPolicy()),
    listCasesEligibleForRetentionReview(),
    listProfiles(),
  ]);

  return { policy, retentionCandidates, users };
}
