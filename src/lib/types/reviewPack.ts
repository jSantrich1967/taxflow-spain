export interface ReviewPackFieldRow {
  label: string;
  value: string;
  source?: string;
  confidence?: number;
  approved?: boolean;
}

export interface ReviewPackChecklistRow {
  documentName: string;
  category: string;
  required: boolean;
  status: string;
}

export interface ReviewPackDocumentRow {
  fileName: string;
  documentType: string | null;
  status: string;
  uploadedAt: string;
}

export interface ReviewPackNote {
  author: string | null;
  content: string;
  createdAt: string;
}

export interface ReviewPackApproval {
  approvedBy: string | null;
  approvedAt: string | null;
  status: string;
  notes: string | null;
}

export interface ReviewPackDraftField {
  key: string;
  label: string;
  value: string;
  missing: boolean;
}

export interface Modelo030ReviewPack {
  packType: "MODELO_030";
  caseNumber: string;
  generatedAt: string;
  caseStatus: string;
  contact: ReviewPackFieldRow[];
  director: ReviewPackFieldRow[];
  passport: ReviewPackFieldRow[];
  idStatus: {
    hasSpanishDni: boolean;
    hasSpanishNie: boolean;
    hasSpanishNif: boolean;
    nifMReceived: boolean;
    nifMNumber: string | null;
  };
  reasonForModelo030: string;
  extractedFields: ReviewPackFieldRow[];
  draftFields: ReviewPackDraftField[];
  checklist: ReviewPackChecklistRow[];
  documents: ReviewPackDocumentRow[];
  missingInformation: string[];
  inconsistencies: string[];
  warnings: string[];
  analystNotes: ReviewPackNote[];
  approval: ReviewPackApproval | null;
  draftApproval: ReviewPackApproval | null;
}

export interface Modelo036ReviewPack {
  packType: "MODELO_036";
  caseNumber: string;
  generatedAt: string;
  caseStatus: string;
  company: ReviewPackFieldRow[];
  director: ReviewPackFieldRow[];
  representative: ReviewPackFieldRow[];
  idStatus: {
    nifMReceived: boolean;
    nifMNumber: string | null;
    modelo036Locked: boolean;
  };
  businessActivity: string | null;
  flags: {
    vatReviewRequired: boolean;
    roiReviewRequired: boolean;
    requiresModelo036: boolean;
  };
  extractedFields: ReviewPackFieldRow[];
  draftFields: ReviewPackDraftField[];
  checklist: ReviewPackChecklistRow[];
  documents: ReviewPackDocumentRow[];
  missingInformation: string[];
  inconsistencies: string[];
  warnings: string[];
  analystNotes: ReviewPackNote[];
  approval: ReviewPackApproval | null;
  draftApproval: ReviewPackApproval | null;
}
