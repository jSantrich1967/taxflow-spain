"use server";

import { revalidatePath } from "next/cache";
import { ingestEmail } from "@/lib/services/emailIngestionService";
import { ingestCrmRecord } from "@/lib/services/crmIngestionService";
import { runIntakeExtraction } from "@/lib/services/aiIntakeService";

export async function ingestEmailAction(
  caseId: string,
  formData: FormData,
) {
  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "").trim();
  const runExtraction = formData.get("runExtraction") === "on";

  const result = await ingestEmail({
    caseId,
    fromEmail: fromEmail || undefined,
    subject: subject || undefined,
    bodyText,
  });

  if (!result.success) return result;

  if (runExtraction) {
    await runIntakeExtraction({ caseId });
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath(`/cases/${caseId}/review`);

  return result;
}

export async function ingestCrmAction(caseId: string, formData: FormData) {
  const crmName = String(formData.get("crmName") ?? "manual_import").trim();
  const externalRecordId = String(formData.get("externalRecordId") ?? "").trim();
  const crmJson = String(formData.get("crmJson") ?? "").trim();
  const runExtraction = formData.get("runExtraction") === "on";

  if (!crmJson) {
    return { success: false, error: "CRM JSON is required" };
  }

  const result = await ingestCrmRecord({
    caseId,
    crmName,
    externalRecordId: externalRecordId || undefined,
    payload: crmJson,
  });

  if (!result.success) return result;

  if (runExtraction) {
    await runIntakeExtraction({ caseId });
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath(`/cases/${caseId}/review`);

  return result;
}
