import { AiExtractionOutput } from "@/lib/schemas/aiExtractionSchema";
import { AutofillFieldRecord, Modelo030Draft, DraftField } from "@/lib/types";
import {
  autofillFieldsToMap,
  getEffectiveFieldValue,
  mapExtractionToAutofillFields,
} from "@/lib/services/fieldAutofillService";

/** Required draft field keys for Modelo 030 internal draft completeness check */
export const MODELO_030_REQUIRED_DRAFT_KEYS = [
  "interested_person.first_name",
  "interested_person.first_surname",
  "interested_person.nationality",
  "interested_person.passport_number",
  "interested_person.date_of_birth",
  "foreign_address.country",
  "contact.email",
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
 * Map AI-extracted and analyst-approved data into an internal Modelo 030 draft.
 * This is NOT an official AEAT submission — internal draft only.
 */
export function mapToModelo030Draft(
  extraction: AiExtractionOutput,
  approvedFields?: AutofillFieldRecord[],
): Modelo030Draft {
  const autofillFields = approvedFields ?? mapExtractionToAutofillFields(extraction);
  const fieldMap = autofillFieldsToMap(autofillFields);

  const director = extraction.director;
  const representative = extraction.representative;

  const fields: Record<string, DraftField> = {
    "presentation.cause": draftField(
      "presentation.cause",
      "Causa de presentación",
      "Solicitud de NIF por persona física que no disponga de DNI/NIE",
    ),
    "interested_person.passport_number": draftField(
      "interested_person.passport_number",
      "Número de pasaporte",
      fieldMap["director.passport_number"] ?? director.passport_number,
    ),
    "interested_person.foreign_tax_id": draftField(
      "interested_person.foreign_tax_id",
      "ID fiscal extranjero",
      director.foreign_tax_id || null,
    ),
    "interested_person.nationality": draftField(
      "interested_person.nationality",
      "Nacionalidad",
      fieldMap["director.nationality"] ?? director.nationality,
    ),
    "interested_person.first_surname": draftField(
      "interested_person.first_surname",
      "Primer apellido",
      director.last_name_1 || null,
    ),
    "interested_person.second_surname": draftField(
      "interested_person.second_surname",
      "Segundo apellido",
      director.last_name_2 || null,
    ),
    "interested_person.first_name": draftField(
      "interested_person.first_name",
      "Nombre",
      director.first_name || null,
    ),
    "interested_person.date_of_birth": draftField(
      "interested_person.date_of_birth",
      "Fecha de nacimiento",
      fieldMap["director.date_of_birth"] ?? director.date_of_birth,
    ),
    "interested_person.place_of_birth": draftField(
      "interested_person.place_of_birth",
      "Lugar de nacimiento",
      [director.place_of_birth_city, director.place_of_birth_country]
        .filter(Boolean)
        .join(", ") || null,
    ),
    "foreign_address.address": draftField(
      "foreign_address.address",
      "Dirección extranjera",
      director.address || null,
    ),
    "foreign_address.city": draftField(
      "foreign_address.city",
      "Ciudad",
      director.city || null,
    ),
    "foreign_address.postal_code": draftField(
      "foreign_address.postal_code",
      "Código postal",
      director.postal_code || null,
    ),
    "foreign_address.province": draftField(
      "foreign_address.province",
      "Provincia / Región / Estado",
      director.province_region_state || null,
    ),
    "foreign_address.country": draftField(
      "foreign_address.country",
      "País",
      fieldMap["director.country"] ?? director.country,
    ),
    "contact.email": draftField(
      "contact.email",
      "Email",
      extraction.client.contact_email || null,
    ),
    "contact.mobile_phone": draftField(
      "contact.mobile_phone",
      "Teléfono móvil",
      extraction.client.contact_phone || null,
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
  };

  const warnings: string[] = [
    "SOLO BORRADOR INTERNO: no es legalmente final. Requiere revisión humana antes de cualquier envío a AEAT.",
    ...extraction.warnings,
  ];

  if (director.has_spanish_dni || director.has_spanish_nie) {
    warnings.push(
      "El director podría tener ya DNI/NIE español. Verifica si el Modelo 030 es realmente necesario.",
    );
  }

  const sourceReferences = autofillFields
    .filter((f) => f.sourceFileName || f.sourceExcerpt)
    .map((f) => ({
      fieldKey: f.fieldKey,
      sourceType: f.sourceType,
      sourceFileName: f.sourceFileName ?? undefined,
      sourceExcerpt: f.sourceExcerpt ?? undefined,
    }));

  const allReviewed = autofillFields.every(
    (f) => !f.requiresHumanReview || f.analystApproved || f.analystCorrectedValue,
  );

  let draft: Modelo030Draft = {
    presentationCause: fields["presentation.cause"].value as string,
    fields,
    warnings,
    missingFields: [],
    sourceReferences,
    humanReviewStatus: allReviewed ? "IN_PROGRESS" : "NOT_STARTED",
  };

  draft = applyApprovedFieldsToModelo030(draft, autofillFields);
  return refreshDraftCompleteness(draft);
}

/**
 * Apply analyst corrections from approved autofill fields into draft values.
 */
export function applyApprovedFieldsToModelo030(
  draft: Modelo030Draft,
  approvedFields: AutofillFieldRecord[],
): Modelo030Draft {
  const updated = { ...draft, fields: { ...draft.fields } };

  for (const field of approvedFields) {
    const effective = getEffectiveFieldValue(field);
    const draftKey = mapAutofillKeyToModelo030(field.fieldKey);
    if (draftKey && updated.fields[draftKey]) {
      updated.fields[draftKey] = {
        ...updated.fields[draftKey],
        value: effective,
        requiresReview: !field.analystApproved,
        confidenceScore: field.confidenceScore,
        sourceReference: field.sourceFileName ?? undefined,
      };
    }
  }

  return updated;
}

function fieldHasValue(value: string | boolean | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  return Boolean(value.toString().trim());
}

/**
 * Detect missing required fields from a draft's field map.
 */
export function detectMissingDraftFields(
  fields: Record<string, DraftField>,
  requiredKeys: string[],
): string[] {
  return requiredKeys.filter((key) => {
    const field = fields[key];
    return !field || !fieldHasValue(field.value);
  });
}

/**
 * Recalculate missing fields and human review status on a draft.
 */
export function refreshDraftCompleteness(
  draft: Modelo030Draft,
): Modelo030Draft {
  const missingFields = detectMissingDraftFields(
    draft.fields,
    MODELO_030_REQUIRED_DRAFT_KEYS,
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

/**
 * Update a single draft field value (analyst edit).
 */
export function updateDraftFieldValue(
  draft: Modelo030Draft,
  fieldKey: string,
  value: string,
): Modelo030Draft {
  if (!draft.fields[fieldKey]) {
    return draft;
  }

  const updated: Modelo030Draft = {
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

  return refreshDraftCompleteness(updated);
}

function mapAutofillKeyToModelo030(fieldKey: string): string | null {
  const mapping: Record<string, string> = {
    "director.passport_number": "interested_person.passport_number",
    "director.nationality": "interested_person.nationality",
    "director.date_of_birth": "interested_person.date_of_birth",
    "representative.nif": "representative.nif",
    "representative.full_name_or_company_name": "representative.name",
    "client.contact_email": "contact.email",
    "client.contact_phone": "contact.mobile_phone",
  };
  return mapping[fieldKey] ?? null;
}
