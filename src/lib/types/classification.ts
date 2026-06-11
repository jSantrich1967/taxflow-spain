/**
 * Classification input derived from AI extraction or persisted case entities.
 */
import { SuggestedStatus } from "@/lib/enums";

export interface ClassificationInput {
  director: {
    hasSpanishDni: boolean;
    hasSpanishNie: boolean;
    hasSpanishNif: boolean;
    nifMReceived: boolean;
  };
  company: {
    legalName?: string | null;
    sellsInSpain: boolean;
    usesAmazonFba: boolean;
    storesInventoryInSpain: boolean;
    performsIntracommunityB2b: boolean;
    needsRoiVies: string;
  };
  isCompanyRegistration: boolean;
}

export interface ClassificationResult {
  requiresModelo030: boolean;
  requiresModelo036: boolean;
  vatReviewRequired: boolean;
  roiReviewRequired: boolean;
  modelo036Locked: boolean;
  suggestedStatus: SuggestedStatus | string;
  warnings: string[];
}
