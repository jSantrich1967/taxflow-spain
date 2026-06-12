"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCase, getCaseById, listCases, getDashboardStats } from "@/lib/services/caseService";
import { runIntakeExtraction } from "@/lib/services/aiIntakeService";
import { uploadDocument } from "@/lib/services/documentService";

export async function createCaseAction(formData: FormData) {
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyCountry = String(formData.get("companyCountry") ?? "").trim();
  const emailText = String(formData.get("emailText") ?? "").trim();
  const emailSubject = String(formData.get("emailSubject") ?? "").trim();
  const emailFrom = String(formData.get("emailFrom") ?? "").trim();
  const crmJson = String(formData.get("crmJson") ?? "").trim();
  const manualNotes = String(formData.get("manualNotes") ?? "").trim();

  const newCase = await createCase({
    contactName: contactName || undefined,
    contactEmail: contactEmail || undefined,
    contactPhone: contactPhone || undefined,
    companyName: companyName || undefined,
    companyCountry: companyCountry || undefined,
    emailText: emailText || undefined,
    emailSubject: emailSubject || undefined,
    emailFrom: emailFrom || undefined,
    crmJson: crmJson || undefined,
    manualNotes: manualNotes || undefined,
  });

  // Handle file uploads
  const files = formData.getAll("documents") as File[];
  for (const file of files) {
    if (file && file.size > 0 && file.name) {
      await uploadDocument({
        caseId: newCase.id,
        caseNumber: newCase.caseNumber,
        file,
      });
    }
  }

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  redirect(`/cases/${newCase.id}`);
}

export async function getCasesAction() {
  return listCases();
}

export async function getCaseAction(caseId: string) {
  return getCaseById(caseId);
}

export async function getDashboardStatsAction() {
  return getDashboardStats();
}

export async function runExtractionAction(caseId: string) {
  const result = await runIntakeExtraction({ caseId });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/review`);
  revalidatePath("/cases");
  revalidatePath("/dashboard");

  return result;
}

export async function uploadCaseDocumentAction(caseId: string, formData: FormData) {
  const caseRecord = await getCaseById(caseId);
  if (!caseRecord) {
    return { success: false, error: "Caso no encontrado" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No se proporcionó ningún archivo" };
  }

  const documentType = String(formData.get("documentType") ?? "").trim() || undefined;

  const result = await uploadDocument({
    caseId,
    caseNumber: caseRecord.caseNumber,
    file,
    documentType,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/review`);

  return result;
}
