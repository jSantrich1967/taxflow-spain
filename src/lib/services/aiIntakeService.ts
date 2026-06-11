import prisma from "@/lib/db";
import { extractStructuredData } from "@/lib/services/openaiExtractionService";
import { createAiRun } from "@/lib/services/aiRunService";
import {
  mapExtractionToAutofillFields,
  persistAutofillFields,
} from "@/lib/services/fieldAutofillService";
import {
  classifyCase,
  classificationInputFromExtraction,
} from "@/lib/services/classificationService";
import { generateChecklist } from "@/lib/services/checklistService";
import { gatherDocumentTextsForCase } from "@/lib/services/documentService";
import { logAuditEvent } from "@/lib/services/auditService";
import {
  AiInputType,
  CaseStatus,
  ChecklistStatus,
  DocumentStatus,
} from "@/generated/prisma/client";
import { SUGGESTED_STATUSES } from "@/lib/enums";

export interface RunIntakeExtractionInput {
  caseId: string;
  userName?: string;
  additionalEmailText?: string;
  additionalNotes?: string;
}

export interface RunIntakeExtractionResult {
  success: boolean;
  error?: string;
  aiRunId?: string;
  fieldsCount?: number;
}

function mapSuggestedStatusToCaseStatus(suggested: string): CaseStatus {
  const map: Record<string, CaseStatus> = {
    [SUGGESTED_STATUSES.MODELO_030_REQUIRED]: CaseStatus.MODELO_030_REQUIRED,
    [SUGGESTED_STATUSES.MODELO_036_ACTIVE]: CaseStatus.MODELO_036_ACTIVE,
    [SUGGESTED_STATUSES.VAT_ROI_REVIEW]: CaseStatus.VAT_ROI_REVIEW,
    [SUGGESTED_STATUSES.DOCUMENTS_PENDING]: CaseStatus.DOCUMENTS_PENDING,
    [SUGGESTED_STATUSES.ANALYST_REVIEW]: CaseStatus.ANALYST_REVIEW,
  };
  return map[suggested] ?? CaseStatus.ANALYST_REVIEW;
}

async function upsertEntitiesFromExtraction(
  caseId: string,
  data: Awaited<ReturnType<typeof extractStructuredData>>["data"],
) {
  if (!data) return;

  const { director, company, representative, client } = data;

  await prisma.case.update({
    where: { id: caseId },
    data: {
      contactName: client.contact_name || undefined,
      contactEmail: client.contact_email || undefined,
      contactPhone: client.contact_phone || undefined,
      companyName: client.company_name || company.legal_name || undefined,
      companyCountry: client.company_country || company.country_of_incorporation || undefined,
      nifMReceived: director.nif_m_received,
    },
  });

  await prisma.director.upsert({
    where: { caseId },
    create: {
      caseId,
      fullName: director.full_name || null,
      firstName: director.first_name || null,
      lastName1: director.last_name_1 || null,
      lastName2: director.last_name_2 || null,
      nationality: director.nationality || null,
      passportNumber: director.passport_number || null,
      passportExpiryDate: director.passport_expiry_date || null,
      dateOfBirth: director.date_of_birth || null,
      placeOfBirthCity: director.place_of_birth_city || null,
      placeOfBirthProvince: director.place_of_birth_province || null,
      placeOfBirthCountry: director.place_of_birth_country || null,
      foreignTaxId: director.foreign_tax_id || null,
      address: director.address || null,
      city: director.city || null,
      provinceRegionState: director.province_region_state || null,
      postalCode: director.postal_code || null,
      country: director.country || null,
      countryCode: director.country_code || null,
      hasSpanishDni: director.has_spanish_dni,
      hasSpanishNie: director.has_spanish_nie,
      hasSpanishNif: director.has_spanish_nif,
      nifMNumber: director.nif_m_number || null,
    },
    update: {
      fullName: director.full_name || null,
      firstName: director.first_name || null,
      lastName1: director.last_name_1 || null,
      lastName2: director.last_name_2 || null,
      nationality: director.nationality || null,
      passportNumber: director.passport_number || null,
      passportExpiryDate: director.passport_expiry_date || null,
      dateOfBirth: director.date_of_birth || null,
      placeOfBirthCity: director.place_of_birth_city || null,
      placeOfBirthProvince: director.place_of_birth_province || null,
      placeOfBirthCountry: director.place_of_birth_country || null,
      foreignTaxId: director.foreign_tax_id || null,
      address: director.address || null,
      city: director.city || null,
      provinceRegionState: director.province_region_state || null,
      postalCode: director.postal_code || null,
      country: director.country || null,
      countryCode: director.country_code || null,
      hasSpanishDni: director.has_spanish_dni,
      hasSpanishNie: director.has_spanish_nie,
      hasSpanishNif: director.has_spanish_nif,
      nifMNumber: director.nif_m_number || null,
    },
  });

  if (company.legal_name || company.registration_number) {
    await prisma.company.upsert({
      where: { caseId },
      create: {
        caseId,
        legalName: company.legal_name || null,
        tradingName: company.trading_name || null,
        countryOfIncorporation: company.country_of_incorporation || null,
        countryCode: company.country_code || null,
        registrationNumber: company.registration_number || null,
        foreignTaxId: company.foreign_tax_id || null,
        vatNumber: company.vat_number || null,
        registeredAddress: company.registered_address || null,
        city: company.city || null,
        provinceRegionState: company.province_region_state || null,
        postalCode: company.postal_code || null,
        businessActivity: company.business_activity || null,
        website: company.website || null,
        marketplaceUsed: company.marketplace_used || null,
        sellsInSpain: company.sells_in_spain,
        sellsInEu: company.sells_in_eu,
        usesAmazonFba: company.uses_amazon_fba,
        storesInventoryInSpain: company.stores_inventory_in_spain,
        performsIntracommunityB2b: company.performs_intracommunity_b2b,
        alreadyHasSpanishNif: company.already_has_spanish_nif,
        alreadyHasVatNumber: company.already_has_vat_number,
        needsRoiVies: company.needs_roi_vies,
      },
      update: {
        legalName: company.legal_name || null,
        tradingName: company.trading_name || null,
        countryOfIncorporation: company.country_of_incorporation || null,
        countryCode: company.country_code || null,
        registrationNumber: company.registration_number || null,
        foreignTaxId: company.foreign_tax_id || null,
        vatNumber: company.vat_number || null,
        registeredAddress: company.registered_address || null,
        city: company.city || null,
        provinceRegionState: company.province_region_state || null,
        postalCode: company.postal_code || null,
        businessActivity: company.business_activity || null,
        website: company.website || null,
        marketplaceUsed: company.marketplace_used || null,
        sellsInSpain: company.sells_in_spain,
        sellsInEu: company.sells_in_eu,
        usesAmazonFba: company.uses_amazon_fba,
        storesInventoryInSpain: company.stores_inventory_in_spain,
        performsIntracommunityB2b: company.performs_intracommunity_b2b,
        alreadyHasSpanishNif: company.already_has_spanish_nif,
        alreadyHasVatNumber: company.already_has_vat_number,
        needsRoiVies: company.needs_roi_vies,
      },
    });
  }

  if (representative.full_name_or_company_name || representative.nif) {
    await prisma.representative.upsert({
      where: { caseId },
      create: {
        caseId,
        fullNameOrCompanyName: representative.full_name_or_company_name || null,
        nif: representative.nif || null,
        residentInSpain: representative.resident_in_spain,
        representationType: representative.representation_type || null,
        representationTitle: representative.representation_title || null,
        powerOfAttorneyPresent: representative.power_of_attorney_present,
        authorizationScopeSummary: representative.authorization_scope_summary || null,
      },
      update: {
        fullNameOrCompanyName: representative.full_name_or_company_name || null,
        nif: representative.nif || null,
        residentInSpain: representative.resident_in_spain,
        representationType: representative.representation_type || null,
        representationTitle: representative.representation_title || null,
        powerOfAttorneyPresent: representative.power_of_attorney_present,
        authorizationScopeSummary: representative.authorization_scope_summary || null,
      },
    });
  }
}

/**
 * Orchestrate full AI intake: gather sources, extract, classify, checklist, persist.
 */
export async function runIntakeExtraction(
  input: RunIntakeExtractionInput,
): Promise<RunIntakeExtractionResult> {
  const { caseId, userName = "Analyst" } = input;

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      emailIngestionLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      crmIngestionLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      internalNotes: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!caseRecord) {
    return { success: false, error: "Case not found" };
  }

  await updateCaseStatus(caseId, CaseStatus.AI_EXTRACTION_PENDING, userName);
  await logAuditEvent({
    caseId,
    userName,
    action: "AI_EXTRACTION_STARTED",
  });

  const emailLog = caseRecord.emailIngestionLogs[0];
  const crmLog = caseRecord.crmIngestionLogs[0];
  const documentTexts = await gatherDocumentTextsForCase(caseId);

  const emailParts: string[] = [];
  if (emailLog?.bodySummary) emailParts.push(emailLog.bodySummary);
  if (input.additionalEmailText) emailParts.push(input.additionalEmailText);

  const manualNotes = [
    ...caseRecord.internalNotes.map((n) => n.note),
    input.additionalNotes ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const inputType: AiInputType =
    documentTexts.length > 0
      ? AiInputType.DOCUMENT
      : emailParts.length > 0
        ? AiInputType.EMAIL
        : crmLog
          ? AiInputType.CRM
          : AiInputType.MANUAL;

  const extractionResult = await extractStructuredData({
    caseId,
    inputType,
    emailText: emailParts.join("\n\n") || undefined,
    crmData: crmLog?.payloadJson
      ? (crmLog.payloadJson as Record<string, unknown>)
      : undefined,
    documentTexts: documentTexts.map((d) => ({
      fileName: d.fileName,
      content: d.content,
    })),
    manualNotes: manualNotes || undefined,
  });

  const aiRun = await createAiRun({
    caseId,
    inputType,
    inputSummary: `Email: ${emailParts.length > 0}, Docs: ${documentTexts.length}, CRM: ${crmLog ? "yes" : "no"}`,
    result: extractionResult,
    data: extractionResult.data,
  });

  if (!extractionResult.success || !extractionResult.data) {
    await logAuditEvent({
      caseId,
      userName,
      action: "AI_EXTRACTION_FAILED",
      newValue: extractionResult.error ?? "Unknown error",
      metadata: { aiRunId: aiRun.id },
    });
    await updateCaseStatus(caseId, CaseStatus.ANALYST_REVIEW, userName);
    return {
      success: false,
      error: extractionResult.error,
      aiRunId: aiRun.id,
    };
  }

  const extraction = extractionResult.data;
  const autofillFields = mapExtractionToAutofillFields(extraction);
  const fieldsCount = await persistAutofillFields(caseId, autofillFields);

  await upsertEntitiesFromExtraction(caseId, extraction);

  const classification = classifyCase(
    classificationInputFromExtraction(extraction.director, extraction.company),
  );

  await prisma.case.update({
    where: { id: caseId },
    data: {
      requiresModelo030: classification.requiresModelo030,
      requiresModelo036: classification.requiresModelo036,
      vatReviewRequired: classification.vatReviewRequired,
      roiReviewRequired: classification.roiReviewRequired,
      modelo036Locked: classification.modelo036Locked,
      nifMReceived: extraction.director.nif_m_received,
      status: CaseStatus.AI_EXTRACTION_COMPLETED,
    },
  });

  await logAuditEvent({
    caseId,
    userName,
    action: "CASE_CLASSIFIED",
    metadata: classification as unknown as Record<string, unknown>,
  });

  // Regenerate checklist from classification
  await prisma.checklistItem.deleteMany({ where: { caseId } });
  const checklist = generateChecklist(classification);
  if (checklist.length > 0) {
    await prisma.checklistItem.createMany({
      data: checklist.map((item) => ({
        caseId,
        documentName: item.documentName,
        category: item.category,
        required: item.required,
        status: item.status as ChecklistStatus,
        notes: item.notes ?? null,
      })),
    });
    await logAuditEvent({
      caseId,
      userName,
      action: "CHECKLIST_GENERATED",
      newValue: String(checklist.length),
    });
  }

  // Mark documents as AI processed
  await prisma.document.updateMany({
    where: { caseId },
    data: {
      aiProcessed: true,
      aiConfidenceScore: extraction.confidence_score,
      status: DocumentStatus.AI_PROCESSED,
    },
  });

  const nextStatus = mapSuggestedStatusToCaseStatus(classification.suggestedStatus);
  await updateCaseStatus(caseId, nextStatus, userName);

  await logAuditEvent({
    caseId,
    userName,
    action: "AI_EXTRACTION_COMPLETED",
    newValue: String(fieldsCount),
    metadata: {
      aiRunId: aiRun.id,
      confidence: extraction.confidence_score,
      suggestedStatus: classification.suggestedStatus,
    },
  });

  for (const field of autofillFields) {
    await logAuditEvent({
      caseId,
      action: "FIELD_AUTOFILLED",
      newValue: field.fieldKey,
      metadata: {
        confidence: field.confidenceScore,
        sourceType: field.sourceType,
      },
    });
  }

  if (emailLog) {
    await prisma.emailIngestionLog.update({
      where: { id: emailLog.id },
      data: { processed: true },
    });
  }
  if (crmLog) {
    await prisma.crmIngestionLog.update({
      where: { id: crmLog.id },
      data: { processed: true },
    });
  }

  return {
    success: true,
    aiRunId: aiRun.id,
    fieldsCount,
  };
}

async function updateCaseStatus(
  caseId: string,
  status: CaseStatus,
  userName?: string,
) {
  const existing = await prisma.case.findUnique({
    where: { id: caseId },
    select: { status: true },
  });
  if (!existing) return;

  await prisma.case.update({
    where: { id: caseId },
    data: { status },
  });

  if (existing.status !== status) {
    await logAuditEvent({
      caseId,
      userName,
      action: "STATUS_CHANGED",
      previousValue: existing.status,
      newValue: status,
    });
  }
}
