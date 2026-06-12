import {
  CHECKLIST_CATEGORIES,
  CHECKLIST_STATUSES,
  ChecklistCategory,
} from "@/lib/enums";
import { ClassificationResult } from "@/lib/types/classification";
import { ChecklistItemDefinition } from "@/lib/types";

const MODELO_030_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Pasaporte del director",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Prueba de domicilio",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Poder de representación / autorización fiscal",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Motivo para solicitar NIF español",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
  {
    documentName: "Datos de contacto",
    category: CHECKLIST_CATEGORIES.MODELO_030,
    required: true,
  },
];

const MODELO_036_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Certificado de constitución de la empresa",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Extracto del registro mercantil",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Estatutos sociales (si aplica)",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: false,
  },
  {
    documentName: "Documento de identificación del director",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "NIF M / NIE / DNI del representante",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Poder de representación",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
  {
    documentName: "Descripción de actividad empresarial",
    category: CHECKLIST_CATEGORIES.MODELO_036,
    required: true,
  },
];

const VAT_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Evidencia de actividad comercial en España",
    category: CHECKLIST_CATEGORIES.VAT,
    required: true,
  },
  {
    documentName: "Información de Amazon FBA / almacén",
    category: CHECKLIST_CATEGORIES.VAT,
    required: false,
  },
  {
    documentName: "Información de canales de venta",
    category: CHECKLIST_CATEGORIES.VAT,
    required: true,
  },
  {
    documentName: "Información de inventario en España (si aplica)",
    category: CHECKLIST_CATEGORIES.VAT,
    required: false,
  },
];

const ROI_VIES_ITEMS: Omit<ChecklistItemDefinition, "status">[] = [
  {
    documentName: "Evidencia de operaciones B2B intracomunitarias",
    category: CHECKLIST_CATEGORIES.ROI_VIES,
    required: true,
  },
  {
    documentName: "Información de clientes / proveedores UE",
    category: CHECKLIST_CATEGORIES.ROI_VIES,
    required: true,
  },
  {
    documentName: "Flujo esperado de operaciones UE",
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
