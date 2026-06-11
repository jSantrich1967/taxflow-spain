import {
  CHECKLIST_CATEGORIES,
  CHECKLIST_STATUSES,
  ChecklistCategory,
} from "@/lib/enums";
import { ClassificationResult } from "@/lib/types/classification";
import { ChecklistItemDefinition } from "@/lib/types";

const MODELO_030_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Director passport",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Proof of address",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Power of attorney / tax authorization",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Reason for requesting Spanish NIF",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Contact details",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
];

const MODELO_036_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Company incorporation certificate",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Company registry extract",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Articles of association (if applicable)",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: false,
  },
  {
    documentName: "Director identification document",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "NIF M / NIE / DNI of representative",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Power of attorney",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Business activity description",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
];

const VAT_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Evidence of commercial activity in Spain",
    category: CHECKLIST_CATEGORIES.VAT,
    required: true,
  },
  {
    documentName: "Amazon FBA / warehouse information",
    category: CHECKLIST_CATEGORIES.VAT,
    required: false,
  },
  {
    documentName: "Sales channels information",
    category: CHECKLIST_CATEGORIES.VAT,
    required: true,
  },
  {
    documentName: "Spanish inventory information (if applicable)",
    category: CHECKLIST_CATEGORIES.VAT,
    required: false,
  },
];

const ROI_VIES_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Evidence of intra-community B2B transactions",
    category: CHECKLIST_CATEGORIES.ROI_VIES,
    required: true,
  },
  {
    documentName: "EU customer / supplier information",
    category: CHECKLIST_CATEGORIES.ROI_VIES,
    required: true,
  },
  {
    documentName: "Expected EU transaction flow",
    category: CHECKLIST_CATEGORIES.ROI_VIES,
    required: true,
  },
];

function toChecklistItem(
  item: Omit<ChecklistItemDefinition, "status">,
): ChecklistItemDefinition {
  return {
    ...item,
    status: CHECKLIST_STATUSES.PENDING,
  };
}

function dedupeByName(
  items: ChecklistItemDefinition[],
): ChecklistItemDefinition[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}:${item.documentName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate document checklist based on deterministic classification.
 */
export function generateChecklist(
  classification: ClassificationResult,
): ChecklistItemDefinition[] {
  const items: ChecklistItemDefinition[] = [];

  if (classification.requiresModelo030) {
    items.push(...MODELO_030_ITEMS.map(toChecklistItem));
  }

  if (classification.requiresModelo036) {
    items.push(...MODELO_036_ITEMS.map(toChecklistItem));
  }

  if (classification.vatReviewRequired) {
    items.push(...VAT_ITEMS.map(toChecklistItem));
  }

  if (classification.roiReviewRequired) {
    items.push(...ROI_VIES_ITEMS.map(toChecklistItem));
  }

  return dedupeByName(items);
}

/**
 * Filter checklist items by category.
 */
export function filterChecklistByCategory(
  items: ChecklistItemDefinition[],
  category: ChecklistCategory,
): ChecklistItemDefinition[] {
  return items.filter((item) => item.category === category);
}

/**
 * Count pending required checklist items.
 */
export function countPendingRequired(items: ChecklistItemDefinition[]): number {
  return items.filter(
    (item) =>
      item.required &&
      item.status === CHECKLIST_STATUSES.PENDING,
  ).length;
}
