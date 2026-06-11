import prisma from "@/lib/db";
import { AiExtractionOutput } from "@/lib/schemas/aiExtractionSchema";
import {
  HUMAN_REVIEW_CONFIDENCE_THRESHOLD,
  SOURCE_TYPES,
} from "@/lib/enums";
import { AutofillFieldRecord } from "@/lib/types";
import { EntityType, ExtractedField, SourceType } from "@/generated/prisma/client";

type FieldMapping = {
  fieldKey: string;
  fieldLabel: string;
  entityType: string;
  getValue: (data: AiExtractionOutput) => string | null;
  getSource?: (data: AiExtractionOutput) => {
    sourceType: string;
    sourceFileName?: string;
    sourceExcerpt?: string;
    confidenceScore: number;
  };
};

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    fieldKey: "client.contact_name",
    fieldLabel: "Contact Name",
    entityType: "CASE",
    getValue: (d) => d.client.contact_name || null,
  },
  {
    fieldKey: "client.contact_email",
    fieldLabel: "Contact Email",
    entityType: "CASE",
    getValue: (d) => d.client.contact_email || null,
  },
  {
    fieldKey: "client.contact_phone",
    fieldLabel: "Contact Phone",
    entityType: "CASE",
    getValue: (d) => d.client.contact_phone || null,
  },
  {
    fieldKey: "director.full_name",
    fieldLabel: "Director Full Name",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.full_name || null,
  },
  {
    fieldKey: "director.passport_number",
    fieldLabel: "Passport Number",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.passport_number || null,
    getSource: (d) => findDocumentSource(d, "passport"),
  },
  {
    fieldKey: "director.nationality",
    fieldLabel: "Nationality",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.nationality || null,
  },
  {
    fieldKey: "director.date_of_birth",
    fieldLabel: "Date of Birth",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.date_of_birth || null,
  },
  {
    fieldKey: "director.first_name",
    fieldLabel: "First Name",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.first_name || null,
  },
  {
    fieldKey: "director.last_name_1",
    fieldLabel: "First Surname",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.last_name_1 || null,
  },
  {
    fieldKey: "director.last_name_2",
    fieldLabel: "Second Surname",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.last_name_2 || null,
  },
  {
    fieldKey: "director.foreign_tax_id",
    fieldLabel: "Foreign Tax ID",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.foreign_tax_id || null,
  },
  {
    fieldKey: "director.address",
    fieldLabel: "Director Address",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.address || null,
  },
  {
    fieldKey: "director.country",
    fieldLabel: "Director Country",
    entityType: "DIRECTOR",
    getValue: (d) => d.director.country || null,
  },
  {
    fieldKey: "client.company_name",
    fieldLabel: "Company Name",
    entityType: "CASE",
    getValue: (d) => d.client.company_name || null,
  },
  {
    fieldKey: "company.legal_name",
    fieldLabel: "Legal Company Name",
    entityType: "COMPANY",
    getValue: (d) => d.company.legal_name || null,
  },
  {
    fieldKey: "company.registration_number",
    fieldLabel: "Registration Number",
    entityType: "COMPANY",
    getValue: (d) => d.company.registration_number || null,
  },
  {
    fieldKey: "company.vat_number",
    fieldLabel: "VAT Number",
    entityType: "COMPANY",
    getValue: (d) => d.company.vat_number || null,
  },
  {
    fieldKey: "representative.full_name_or_company_name",
    fieldLabel: "Representative Name",
    entityType: "REPRESENTATIVE",
    getValue: (d) => d.representative.full_name_or_company_name || null,
  },
  {
    fieldKey: "representative.nif",
    fieldLabel: "Representative NIF",
    entityType: "REPRESENTATIVE",
    getValue: (d) => d.representative.nif || null,
  },
];

function findDocumentSource(
  data: AiExtractionOutput,
  keyword: string,
): {
  sourceType: string;
  sourceFileName?: string;
  sourceExcerpt?: string;
  confidenceScore: number;
} {
  const doc = data.documents.find(
    (d) =>
      d.document_type.toLowerCase().includes(keyword) ||
      d.file_name.toLowerCase().includes(keyword),
  );

  if (doc) {
    return {
      sourceType: SOURCE_TYPES.DOCUMENT,
      sourceFileName: doc.file_name,
      sourceExcerpt: doc.summary,
      confidenceScore: doc.confidence_score,
    };
  }

  return {
    sourceType: SOURCE_TYPES.AI_INFERENCE,
    confidenceScore: data.confidence_score,
  };
}

function requiresReview(confidenceScore: number, value: string | null): boolean {
  if (!value?.trim()) return true;
  return confidenceScore < HUMAN_REVIEW_CONFIDENCE_THRESHOLD;
}

/**
 * Map AI extraction output into internal autofill field records.
 */
export function mapExtractionToAutofillFields(
  extraction: AiExtractionOutput,
): AutofillFieldRecord[] {
  return FIELD_MAPPINGS.map((mapping) => {
    const value = mapping.getValue(extraction);
    const source = mapping.getSource?.(extraction) ?? {
      sourceType: SOURCE_TYPES.AI_INFERENCE,
      confidenceScore: extraction.confidence_score,
    };

    const confidenceScore = source.confidenceScore ?? extraction.confidence_score;

    return {
      fieldKey: mapping.fieldKey,
      fieldLabel: mapping.fieldLabel,
      value,
      sourceType: source.sourceType,
      sourceFileName: source.sourceFileName ?? null,
      sourceExcerpt: source.sourceExcerpt ?? null,
      confidenceScore,
      requiresHumanReview: requiresReview(confidenceScore, value),
      analystCorrectedValue: null,
      analystApproved: false,
      approvedBy: null,
      approvedAt: null,
      entityType: mapping.entityType,
    };
  });
}

/**
 * Resolve the effective field value (analyst correction takes precedence).
 */
export function getEffectiveFieldValue(field: AutofillFieldRecord): string | null {
  if (field.analystCorrectedValue?.trim()) {
    return field.analystCorrectedValue;
  }
  return field.value;
}

/**
 * Convert autofill records to a flat key-value map for draft mapping.
 */
export function autofillFieldsToMap(
  fields: AutofillFieldRecord[],
): Record<string, string | null> {
  return fields.reduce<Record<string, string | null>>((acc, field) => {
    acc[field.fieldKey] = getEffectiveFieldValue(field);
    return acc;
  }, {});
}

/**
 * Convert persisted ExtractedField rows to AutofillFieldRecord for draft mapping.
 */
export function dbExtractedFieldsToAutofill(
  fields: ExtractedField[],
): AutofillFieldRecord[] {
  return fields.map((f) => ({
    fieldKey: f.fieldKey,
    fieldLabel: f.fieldLabel,
    value: f.value,
    sourceType: f.sourceType,
    sourceFileName: f.sourceFileName,
    sourceExcerpt: f.sourceExcerpt,
    confidenceScore: f.confidenceScore,
    requiresHumanReview: f.requiresHumanReview,
    analystCorrectedValue: f.analystCorrectedValue,
    analystApproved: f.analystApproved,
    approvedBy: f.approvedBy,
    approvedAt: f.approvedAt,
    entityType: f.entityType,
  }));
}

function toEntityType(entityType: string): EntityType {
  const map: Record<string, EntityType> = {
    CASE: EntityType.CASE,
    DIRECTOR: EntityType.DIRECTOR,
    COMPANY: EntityType.COMPANY,
    REPRESENTATIVE: EntityType.REPRESENTATIVE,
    MODELO_030: EntityType.MODELO_030,
    MODELO_036: EntityType.MODELO_036,
  };
  return map[entityType] ?? EntityType.CASE;
}

function toSourceType(sourceType: string): SourceType {
  const map: Record<string, SourceType> = {
    EMAIL: SourceType.EMAIL,
    CRM: SourceType.CRM,
    DOCUMENT: SourceType.DOCUMENT,
    MANUAL: SourceType.MANUAL,
    AI_INFERENCE: SourceType.AI_INFERENCE,
  };
  return map[sourceType] ?? SourceType.AI_INFERENCE;
}

/**
 * Persist autofill fields to DB (replace all fields for case).
 */
export async function persistAutofillFields(
  caseId: string,
  fields: AutofillFieldRecord[],
): Promise<number> {
  await prisma.extractedField.deleteMany({ where: { caseId } });

  if (fields.length === 0) return 0;

  await prisma.extractedField.createMany({
    data: fields.map((field) => ({
      caseId,
      entityType: toEntityType(field.entityType),
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel,
      value: field.value,
      sourceType: toSourceType(field.sourceType),
      sourceFileName: field.sourceFileName,
      sourceExcerpt: field.sourceExcerpt,
      confidenceScore: field.confidenceScore,
      requiresHumanReview: field.requiresHumanReview,
      analystCorrectedValue: field.analystCorrectedValue,
      analystApproved: field.analystApproved,
      approvedBy: field.approvedBy,
      approvedAt: field.approvedAt,
    })),
  });

  return fields.length;
}
