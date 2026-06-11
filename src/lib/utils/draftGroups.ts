import { DraftField } from "@/lib/types";

const SECTION_LABELS: Record<string, string> = {
  presentation: "Presentation Cause",
  interested_person: "Interested Person",
  foreign_address: "Foreign Address",
  spanish_address: "Spanish Fiscal Address",
  contact: "Contact",
  representative: "Representative",
  entity: "Legal Entity",
  economic_activity: "Economic Activity",
  vat: "VAT",
  roi: "ROI / VIES",
  director: "Director Status",
  signature: "Signature Metadata",
};

export function groupDraftFields(
  fields: Record<string, DraftField>,
): Array<{ section: string; label: string; entries: Array<[string, DraftField]> }> {
  const groups = new Map<string, Array<[string, DraftField]>>();

  for (const [key, field] of Object.entries(fields)) {
    const section = key.split(".")[0] ?? "other";
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push([key, field]);
  }

  return Array.from(groups.entries()).map(([section, entries]) => ({
    section,
    label: SECTION_LABELS[section] ?? section.replace(/_/g, " "),
    entries: entries.sort(([a], [b]) => a.localeCompare(b)),
  }));
}

export function buildFieldLabelMap(
  fields: Record<string, DraftField>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.label]),
  );
}
