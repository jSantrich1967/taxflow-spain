import { AiExtractionOutput } from "@/lib/schemas/aiExtractionSchema";
import { AutofillFieldRecord, Modelo036Draft, DraftField } from "@/lib/types";
import {
  autofillFieldsToMap,
  getEffectiveFieldValue,
  mapExtractionToAutofillFields,
} from "@/lib/services/fieldAutofillService";

/** Required draft field keys for Modelo 036 internal draft completeness check */
export const MODELO_036_REQUIRED_DRAFT_KEYS = [
  "entity.legal_name",
  "entity.registration_number",
  "entity.country_code",
  "foreign_address.country",
  "representative.nif",
  "representative.name",
];

function draftField(
  key: string,
  label: string,
  value: string | boolean | null,
  options?: Partial<DraftField>,
): DraftField {
  return {
    key,
    label,
    value,
    requiresReview: options?.requiresReview ?? !value,
    confidenceScore: options?.confidenceScore,
    sourceReference: options?.sourceReference,
  };
}

/**
 * Map AI-extracted and analyst-approved data into an internal Modelo 036 draft.
 * This is NOT an official AEAT submission — internal draft only.
 */
export function mapToModelo036Draft(
  extraction: AiExtractionOutput,
  approvedFields?: AutofillFieldRecord[],
  options?: { modelo036Locked?: boolean },
): Modelo036Draft {
  const autofillFields = approvedFields ?? mapExtractionToAutofillFields(extraction);
  const fieldMap = autofillFieldsToMap(autofillFields);

  const company = extraction.company;
  const representative = extraction.representative;
  const director = extraction.director;

  const fields: Record<string, DraftField> = {
    "presentation.cause": draftField(
      "presentation.cause",
      "Causa de presentación",
      "Alta en el censo de empresarios, profesionales y retenedores",
    ),
    "entity.legal_name": draftField(
      "entity.legal_name",
      "Nombre legal de la empresa",
      fieldMap["company.legal_name"] ?? company.legal_name,
    ),
    "entity.foreign_tax_id": draftField(
      "entity.foreign_tax_id",
      "ID fiscal extranjero / ID IVA",
      company.foreign_tax_id || company.vat_number || null,
    ),
    "entity.country_code": draftField(
      "entity.country_code",
      "Código de país",
      company.country_code || null,
    ),
    "entity.registration_number": draftField(
      "entity.registration_number",
      "Número de registro",
      fieldMap["company.registration_number"] ?? company.registration_number,
    ),
    "entity.email": draftField(
      "entity.email",
      "Email",
      extraction.client.contact_email || null,
    ),
    "entity.phone": draftField(
      "entity.phone",
      "Teléfono",
      extraction.client.contact_phone || null,
    ),
    "entity.website": draftField(
      "entity.website",
      "Sitio web",
      company.website || null,
    ),
    "foreign_address.address": draftField(
      "foreign_address.address",
      "Dirección registrada",
      company.registered_address || null,
    ),
    "foreign_address.city": draftField(
      "foreign_address.city",
      "Ciudad",
      company.city || null,
    ),
    "foreign_address.postal_code": draftField(
      "foreign_address.postal_code",
      "Código postal",
      company.postal_code || null,
    ),
    "foreign_address.country": draftField(
      "foreign_address.country",
      "País",
      company.country_of_incorporation || null,
    ),
    "representative.nif": draftField(
      "representative.nif",
      "NIF del representante",
      fieldMap["representative.nif"] ?? representative.nif,
    ),
    "representative.name": draftField(
      "representative.name",
      "Nombre del representante",
      fieldMap["representative.full_name_or_company_name"] ??
        representative.full_name_or_company_name,
    ),
    "representative.resident_in_spain": draftField(
      "representative.resident_in_spain",
      "Residente en España",
      representative.resident_in_spain,
    ),
    "economic_activity.description": draftField(
      "economic_activity.description",
      "Descripción de actividad",
      company.business_activity || null,
    ),
    "vat.established_in_spain": draftField(
      "vat.established_in_spain",
      "Establecido en territorio IVA español",
      company.stores_inventory_in_spain || company.sells_in_spain,
    ),
    "vat.review_required": draftField(
      "vat.review_required",
      "Revisión de IVA requerida",
      company.sells_in_spain ||
        company.uses_amazon_fba ||
        company.stores_inventory_in_spain,
    ),
    "roi.request_registration": draftField(
      "roi.request_registration",
      "Solicitar registro ROI / VIES",
      company.needs_roi_vies === "yes" || company.performs_intracommunity_b2b,
    ),
    "director.nif_m_status": draftField(
      "director.nif_m_status",
      "Estado NIF M del director",
      director.nif_m_received ? "received" : "pending",
    ),
  };

  const missingFields = detectMissingDraftFields036(
    fields,
    MODELO_036_REQUIRED_DRAFT_KEYS,
  );

  const warnings: string[] = [
    "SOLO BORRADOR INTERNO: no es legalmente final. Requiere revisión humana antes de cualquier envío a AEAT.",
    ...extraction.warnings,
  ];

  if (options?.modelo036Locked) {
    warnings.push(
      "El Modelo 036 está BLOQUEADO hasta recibir el NIF M del director extranjero.",
    );
  }

  if (company.performs_intracommunity_b2b) {
    warnings.push("Intra-community B2B activity detected — ROI/VIES review may be required.");
  }

  const sourceReferences = autofillFields
    .filter((f) => f.sourceFileName || f.sourceExcerpt)
    .map((f) => ({
      fieldKey: f.fieldKey,
      sourceType: f.sourceType,
      sourceFileName: f.sourceFileName ?? undefined,
      sourceExcerpt: f.sourceExcerpt ?? undefined,
    }));

  let draft: Modelo036Draft = {
    presentationCause: fields["presentation.cause"].value as string,
    fields,
    warnings,
    missingFields,
    sourceReferences,
    humanReviewStatus: "NOT_STARTED",
  };

  draft = applyApprovedFieldsToModelo036(draft, autofillFields);
  return refreshDraftCompleteness036(draft);
}

/**
 * Apply analyst corrections from approved autofill fields into Modelo 036 draft.
 */
export function applyApprovedFieldsToModelo036(
  draft: Modelo036Draft,
  approvedFields: AutofillFieldRecord[],
): Modelo036Draft {
  const updated = { ...draft, fields: { ...draft.fields } };

  for (const field of approvedFields) {
    const effective = getEffectiveFieldValue(field);
    const draftKey = mapAutofillKeyToModelo036(field.fieldKey);
    if (draftKey && updated.fields[draftKey]) {
      updated.fields[draftKey] = {
        ...updated.fields[draftKey],
        value: effective,
        requiresReview: !field.analystApproved,
        confidenceScore: field.confidenceScore,
      };
    }
  }

  return updated;
}

/**
 * Recalculate missing fields and human review status on a Modelo 036 draft.
 */
export function refreshDraftCompleteness036(
  draft: Modelo036Draft,
): Modelo036Draft {
  const missingFields = detectMissingDraftFields036(
    draft.fields,
    MODELO_036_REQUIRED_DRAFT_KEYS,
  );
  const fieldsNeedingReview = Object.values(draft.fields).filter(
    (f) => f.requiresReview,
  ).length;

  let humanReviewStatus = draft.humanReviewStatus;
  if (missingFields.length === 0 && fieldsNeedingReview === 0) {
    humanReviewStatus = "COMPLETED";
  } else if (fieldsNeedingReview > 0 || missingFields.length > 0) {
    humanReviewStatus = "IN_PROGRESS";
  }

  return { ...draft, missingFields, humanReviewStatus };
}

export function detectMissingDraftFields036(
  fields: Record<string, DraftField>,
  requiredKeys: string[],
): string[] {
  return requiredKeys.filter((key) => {
    const field = fields[key];
    if (!field) return true;
    const val = field.value;
    if (val === null || val === undefined) return true;
    if (typeof val === "boolean") return false;
    return !val.toString().trim();
  });
}

/**
 * Update a single Modelo 036 draft field value.
 */
export function updateDraftFieldValue036(
  draft: Modelo036Draft,
  fieldKey: string,
  value: string,
): Modelo036Draft {
  if (!draft.fields[fieldKey]) return draft;

  const updated: Modelo036Draft = {
    ...draft,
    fields: {
      ...draft.fields,
      [fieldKey]: {
        ...draft.fields[fieldKey],
        value,
        requiresReview: false,
      },
    },
  };

  return refreshDraftCompleteness036(updated);
}

function mapAutofillKeyToModelo036(fieldKey: string): string | null {
  const mapping: Record<string, string> = {
    "company.legal_name": "entity.legal_name",
    "company.registration_number": "entity.registration_number",
    "company.vat_number": "entity.foreign_tax_id",
    "representative.nif": "representative.nif",
    "representative.full_name_or_company_name": "representative.name",
    "client.contact_email": "entity.email",
    "client.contact_phone": "entity.phone",
  };
  return mapping[fieldKey] ?? null;
}
