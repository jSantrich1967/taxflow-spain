import {
  ClassificationInput,
  ClassificationResult,
} from "@/lib/types/classification";
import { SUGGESTED_STATUSES, SuggestedStatus } from "@/lib/enums";

/**
 * Deterministic classification engine.
 * AI suggests workflows; this service applies fixed business rules.
 * Never makes final legal/tax decisions — only workflow routing suggestions.
 */
export function classifyCase(input: ClassificationInput): ClassificationResult {
  const warnings: string[] = [];

  const directorHasSpanishId =
    input.director.hasSpanishDni ||
    input.director.hasSpanishNie ||
    input.director.hasSpanishNif;

  const nifMReceived = input.director.nifMReceived;

  let requiresModelo030 = false;
  let requiresModelo036 = false;
  let vatReviewRequired = false;
  let roiReviewRequired = false;
  let modelo036Locked = false;
  let suggestedStatus: SuggestedStatus = SUGGESTED_STATUSES.ANALYST_REVIEW;

  // Rule 1: Director without Spanish DNI/NIE/NIF → Modelo 030 required
  if (!directorHasSpanishId && !nifMReceived) {
    requiresModelo030 = true;
    suggestedStatus = SUGGESTED_STATUSES.MODELO_030_REQUIRED;
    modelo036Locked = true;
    warnings.push(
      "Director lacks Spanish DNI/NIE/NIF. Modelo 030 is required before Modelo 036 can proceed.",
    );
  }

  // Rule 2: Director has Spanish ID or NIF M received → Modelo 036 can be active
  if (directorHasSpanishId || nifMReceived) {
    requiresModelo030 = false;
    suggestedStatus = SUGGESTED_STATUSES.MODELO_036_ACTIVE;
    modelo036Locked = false;
  }

  // Rule 3: Company tax registration always requires Modelo 036 review
  if (input.isCompanyRegistration || Boolean(input.company.legalName)) {
    requiresModelo036 = true;
  }

  // Rule 4: VAT review triggers
  if (
    input.company.sellsInSpain ||
    input.company.usesAmazonFba ||
    input.company.storesInventoryInSpain
  ) {
    vatReviewRequired = true;
    if (suggestedStatus === SUGGESTED_STATUSES.MODELO_036_ACTIVE) {
      suggestedStatus = SUGGESTED_STATUSES.VAT_ROI_REVIEW;
    }
  }

  // Rule 5: ROI / VIES review triggers
  if (
    input.company.performsIntracommunityB2b ||
    input.company.needsRoiVies === "yes"
  ) {
    roiReviewRequired = true;
    if (suggestedStatus === SUGGESTED_STATUSES.MODELO_036_ACTIVE) {
      suggestedStatus = SUGGESTED_STATUSES.VAT_ROI_REVIEW;
    }
  }

  // Rule 6: Modelo 030 pending blocks Modelo 036
  if (requiresModelo030 && !nifMReceived) {
    modelo036Locked = true;
  }

  // Rule 7: NIF M received unlocks Modelo 036
  if (nifMReceived) {
    modelo036Locked = false;
    if (requiresModelo036) {
      suggestedStatus = SUGGESTED_STATUSES.MODELO_036_ACTIVE;
    }
  }

  return {
    requiresModelo030,
    requiresModelo036,
    vatReviewRequired,
    roiReviewRequired,
    modelo036Locked,
    suggestedStatus,
    warnings,
  };
}

/**
 * Build classification input from AI extraction director/company objects.
 */
export function classificationInputFromExtraction(
  director: {
    has_spanish_dni: boolean;
    has_spanish_nie: boolean;
    has_spanish_nif: boolean;
    nif_m_received: boolean;
  },
  company: {
    legal_name: string;
    sells_in_spain: boolean;
    uses_amazon_fba: boolean;
    stores_inventory_in_spain: boolean;
    performs_intracommunity_b2b: boolean;
    needs_roi_vies: string;
  },
): ClassificationInput {
  return {
    director: {
      hasSpanishDni: director.has_spanish_dni,
      hasSpanishNie: director.has_spanish_nie,
      hasSpanishNif: director.has_spanish_nif,
      nifMReceived: director.nif_m_received,
    },
    company: {
      legalName: company.legal_name || null,
      sellsInSpain: company.sells_in_spain,
      usesAmazonFba: company.uses_amazon_fba,
      storesInventoryInSpain: company.stores_inventory_in_spain,
      performsIntracommunityB2b: company.performs_intracommunity_b2b,
      needsRoiVies: company.needs_roi_vies,
    },
    isCompanyRegistration: Boolean(company.legal_name?.trim()),
  };
}
