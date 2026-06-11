import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import { getLatestModelo030Draft, getLatestModelo036Draft } from "@/lib/services/draftService";
import { validateExtractionOutput } from "@/lib/services/openaiExtractionService";
import { getEffectiveFieldValue, dbExtractedFieldsToAutofill } from "@/lib/services/fieldAutofillService";
import { Modelo030Draft, Modelo036Draft } from "@/lib/types";
import {
  Modelo030ReviewPack,
  Modelo036ReviewPack,
  ReviewPackApproval,
  ReviewPackDraftField,
  ReviewPackFieldRow,
} from "@/lib/types/reviewPack";
import { ApprovalType, DraftStatus } from "@/generated/prisma/client";

const DISCLAIMER =
  "INTERNAL REVIEW PACK ONLY — Not an official AEAT submission. " +
  "Prepared for analyst and supervisor review. All data requires human verification.";

function formatValue(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.trim() || "—";
}

function fieldRow(
  label: string,
  value: string | boolean | null | undefined,
  options?: { source?: string; confidence?: number; approved?: boolean },
): ReviewPackFieldRow {
  return {
    label,
    value: formatValue(value),
    source: options?.source,
    confidence: options?.confidence,
    approved: options?.approved,
  };
}

async function getLatestApproval(
  caseId: string,
  type: ApprovalType,
): Promise<ReviewPackApproval | null> {
  const approval = await prisma.approval.findFirst({
    where: { caseId, approvalType: type, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
  if (!approval) return null;
  return {
    approvedBy: approval.approvedBy,
    approvedAt: approval.createdAt.toISOString(),
    status: approval.status,
    notes: approval.notes,
  };
}

function draftToFieldRows(
  draft: Modelo030Draft | Modelo036Draft | null | undefined,
  missingKeys: string[] = [],
): ReviewPackDraftField[] {
  if (!draft) return [];
  return Object.entries(draft.fields).map(([key, field]) => ({
    key,
    label: field.label,
    value: formatValue(field.value),
    missing: missingKeys.includes(key),
  }));
}

/**
 * Build Modelo 030 internal review pack data.
 */
export async function buildModelo030ReviewPack(
  caseId: string,
  options?: { logGeneration?: boolean },
): Promise<Modelo030ReviewPack | null> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      director: true,
      representative: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      extractedFields: { orderBy: { fieldKey: "asc" } },
      checklistItems: { orderBy: { category: "asc" } },
      internalNotes: { orderBy: { createdAt: "desc" } },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!caseRecord) return null;

  const draftData = await getLatestModelo030Draft(caseId);
  const draft = draftData?.draft;
  const extraction = validateExtractionOutput(
    caseRecord.aiRuns[0]?.structuredOutput,
  );

  const autofillFields = dbExtractedFieldsToAutofill(caseRecord.extractedFields);

  const extractedFields: ReviewPackFieldRow[] = autofillFields.map((f) => ({
    label: f.fieldLabel,
    value: formatValue(getEffectiveFieldValue(f)),
    source: f.sourceFileName
      ? `${f.sourceType} — ${f.sourceFileName}`
      : f.sourceType,
    confidence: f.confidenceScore,
    approved: f.analystApproved,
  }));

  const director = caseRecord.director;
  const pack: Modelo030ReviewPack = {
    packType: "MODELO_030",
    caseNumber: caseRecord.caseNumber,
    generatedAt: new Date().toISOString(),
    caseStatus: caseRecord.status,
    contact: [
      fieldRow("Contact Name", caseRecord.contactName),
      fieldRow("Contact Email", caseRecord.contactEmail),
      fieldRow("Contact Phone", caseRecord.contactPhone),
      fieldRow("Company", caseRecord.companyName),
      fieldRow("Country", caseRecord.companyCountry),
    ],
    director: director
      ? [
          fieldRow("Full Name", director.fullName),
          fieldRow("First Name", director.firstName),
          fieldRow("First Surname", director.lastName1),
          fieldRow("Second Surname", director.lastName2),
          fieldRow("Nationality", director.nationality),
          fieldRow("Date of Birth", director.dateOfBirth),
          fieldRow("Place of Birth", [
            director.placeOfBirthCity,
            director.placeOfBirthCountry,
          ]
            .filter(Boolean)
            .join(", ")),
          fieldRow("Foreign Tax ID", director.foreignTaxId),
          fieldRow("Address", director.address),
          fieldRow("City", director.city),
          fieldRow("Country", director.country),
        ]
      : [],
    passport: director
      ? [
          fieldRow("Passport Number", director.passportNumber),
          fieldRow("Passport Expiry", director.passportExpiryDate),
        ]
      : [],
    idStatus: {
      hasSpanishDni: director?.hasSpanishDni ?? false,
      hasSpanishNie: director?.hasSpanishNie ?? false,
      hasSpanishNif: director?.hasSpanishNif ?? false,
      nifMReceived: caseRecord.nifMReceived,
      nifMNumber: director?.nifMNumber ?? null,
    },
    reasonForModelo030: caseRecord.requiresModelo030
      ? "Foreign director without Spanish DNI/NIE/NIF — NIF M (Modelo 030) required before company registration."
      : "Not classified as Modelo 030 required — verify classification.",
    extractedFields,
    draftFields: draftToFieldRows(draft, draft?.missingFields ?? []),
    checklist: caseRecord.checklistItems.map((item) => ({
      documentName: item.documentName,
      category: item.category,
      required: item.required,
      status: item.status,
    })),
    documents: caseRecord.documents.map((doc) => ({
      fileName: doc.originalFileName,
      documentType: doc.documentType,
      status: doc.status,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
    missingInformation: extraction?.missing_information ?? [],
    inconsistencies: extraction?.inconsistencies ?? [],
    warnings: [
      DISCLAIMER,
      ...(draft?.warnings ?? []),
      ...(extraction?.warnings ?? []),
    ],
    analystNotes: caseRecord.internalNotes.map((n) => ({
      author: n.createdByName,
      content: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
    approval: await getLatestApproval(caseId, ApprovalType.CASE),
    draftApproval:
      draftData?.record?.status === DraftStatus.APPROVED
        ? {
            approvedBy: draftData.record.approvedBy,
            approvedAt: draftData.record.approvedAt?.toISOString() ?? null,
            status: draftData.record.status,
            notes: null,
          }
        : await getLatestApproval(caseId, ApprovalType.MODELO_030_DRAFT),
  };

  if (options?.logGeneration !== false) {
    await logAuditEvent({
      caseId,
      action: "REVIEW_PACK_GENERATED",
      newValue: "MODELO_030",
      metadata: { caseNumber: caseRecord.caseNumber },
    });
  }

  return pack;
}

/**
 * Build Modelo 036 internal review pack data.
 */
export async function buildModelo036ReviewPack(
  caseId: string,
  options?: { logGeneration?: boolean },
): Promise<Modelo036ReviewPack | null> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      director: true,
      company: true,
      representative: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      extractedFields: { orderBy: { fieldKey: "asc" } },
      checklistItems: { orderBy: { category: "asc" } },
      internalNotes: { orderBy: { createdAt: "desc" } },
      aiRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!caseRecord) return null;

  const draftData = await getLatestModelo036Draft(caseId);
  const draft = draftData?.draft;
  const extraction = validateExtractionOutput(
    caseRecord.aiRuns[0]?.structuredOutput,
  );

  const autofillFields = dbExtractedFieldsToAutofill(caseRecord.extractedFields);
  const extractedFields: ReviewPackFieldRow[] = autofillFields.map((f) => ({
    label: f.fieldLabel,
    value: formatValue(getEffectiveFieldValue(f)),
    source: f.sourceFileName
      ? `${f.sourceType} — ${f.sourceFileName}`
      : f.sourceType,
    confidence: f.confidenceScore,
    approved: f.analystApproved,
  }));

  const company = caseRecord.company;
  const director = caseRecord.director;
  const representative = caseRecord.representative;

  const pack: Modelo036ReviewPack = {
    packType: "MODELO_036",
    caseNumber: caseRecord.caseNumber,
    generatedAt: new Date().toISOString(),
    caseStatus: caseRecord.status,
    company: company
      ? [
          fieldRow("Legal Name", company.legalName),
          fieldRow("Trading Name", company.tradingName),
          fieldRow("Country of Incorporation", company.countryOfIncorporation),
          fieldRow("Registration Number", company.registrationNumber),
          fieldRow("Foreign Tax ID", company.foreignTaxId),
          fieldRow("VAT Number", company.vatNumber),
          fieldRow("Registered Address", company.registeredAddress),
          fieldRow("Business Activity", company.businessActivity),
          fieldRow("Website", company.website),
          fieldRow("Sells in Spain", company.sellsInSpain),
          fieldRow("Uses Amazon FBA", company.usesAmazonFba),
          fieldRow("Intra-community B2B", company.performsIntracommunityB2b),
        ]
      : [
          fieldRow("Company Name", caseRecord.companyName),
          fieldRow("Country", caseRecord.companyCountry),
        ],
    director: director
      ? [
          fieldRow("Full Name", director.fullName),
          fieldRow("Nationality", director.nationality),
          fieldRow("Passport", director.passportNumber),
          fieldRow("NIF M Number", director.nifMNumber),
        ]
      : [],
    representative: representative
      ? [
          fieldRow("Name", representative.fullNameOrCompanyName),
          fieldRow("NIF", representative.nif),
          fieldRow("Resident in Spain", representative.residentInSpain),
          fieldRow("Representation Type", representative.representationType),
          fieldRow("Power of Attorney", representative.powerOfAttorneyPresent),
        ]
      : [],
    idStatus: {
      nifMReceived: caseRecord.nifMReceived,
      nifMNumber: director?.nifMNumber ?? null,
      modelo036Locked: caseRecord.modelo036Locked,
    },
    businessActivity: company?.businessActivity ?? null,
    flags: {
      vatReviewRequired: caseRecord.vatReviewRequired,
      roiReviewRequired: caseRecord.roiReviewRequired,
      requiresModelo036: caseRecord.requiresModelo036,
    },
    extractedFields,
    draftFields: draftToFieldRows(draft, draft?.missingFields ?? []),
    checklist: caseRecord.checklistItems.map((item) => ({
      documentName: item.documentName,
      category: item.category,
      required: item.required,
      status: item.status,
    })),
    documents: caseRecord.documents.map((doc) => ({
      fileName: doc.originalFileName,
      documentType: doc.documentType,
      status: doc.status,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
    missingInformation: extraction?.missing_information ?? [],
    inconsistencies: extraction?.inconsistencies ?? [],
    warnings: [
      DISCLAIMER,
      ...(draft?.warnings ?? []),
      ...(extraction?.warnings ?? []),
      ...(caseRecord.modelo036Locked
        ? ["Modelo 036 is LOCKED until NIF M is received."]
        : []),
    ],
    analystNotes: caseRecord.internalNotes.map((n) => ({
      author: n.createdByName,
      content: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
    approval: await getLatestApproval(caseId, ApprovalType.CASE),
    draftApproval:
      draftData?.record?.status === DraftStatus.APPROVED
        ? {
            approvedBy: draftData.record.approvedBy,
            approvedAt: draftData.record.approvedAt?.toISOString() ?? null,
            status: draftData.record.status,
            notes: null,
          }
        : await getLatestApproval(caseId, ApprovalType.MODELO_036_DRAFT),
  };

  if (options?.logGeneration !== false) {
    await logAuditEvent({
      caseId,
      action: "REVIEW_PACK_GENERATED",
      newValue: "MODELO_036",
      metadata: { caseNumber: caseRecord.caseNumber },
    });
  }

  return pack;
}
