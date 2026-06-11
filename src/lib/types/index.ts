import { ChecklistCategory, ChecklistStatus } from "@/lib/enums";

export interface ChecklistItemDefinition {
  documentName: string;
  category: ChecklistCategory;
  required: boolean;
  status: ChecklistStatus;
  notes?: string;
}

export interface DraftField {
  key: string;
  label: string;
  value: string | boolean | null;
  sourceReference?: string;
  confidenceScore?: number;
  requiresReview: boolean;
}

export interface SourceReference {
  fieldKey: string;
  sourceType: string;
  sourceFileName?: string;
  sourceExcerpt?: string;
}

export interface ModeloDraftBase {
  fields: Record<string, DraftField>;
  warnings: string[];
  missingFields: string[];
  sourceReferences: SourceReference[];
  humanReviewStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "REQUIRES_SUPERVISOR";
}

export interface Modelo030Draft extends ModeloDraftBase {
  presentationCause?: string;
}

export interface Modelo036Draft extends ModeloDraftBase {
  presentationCause?: string;
}

export interface AutofillFieldRecord {
  fieldKey: string;
  fieldLabel: string;
  value: string | null;
  sourceType: string;
  sourceFileName: string | null;
  sourceExcerpt: string | null;
  confidenceScore: number;
  requiresHumanReview: boolean;
  analystCorrectedValue: string | null;
  analystApproved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  entityType: string;
}
