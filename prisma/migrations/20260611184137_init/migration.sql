-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "companyName" TEXT,
    "companyCountry" TEXT,
    "assignedAnalyst" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW_CLIENT',
    "requiresModelo030" BOOLEAN NOT NULL DEFAULT false,
    "requiresModelo036" BOOLEAN NOT NULL DEFAULT false,
    "vatReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "roiReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "modelo036Locked" BOOLEAN NOT NULL DEFAULT false,
    "nifMReceived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Director" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "fullName" TEXT,
    "firstName" TEXT,
    "lastName1" TEXT,
    "lastName2" TEXT,
    "nationality" TEXT,
    "passportNumber" TEXT,
    "passportExpiryDate" TEXT,
    "dateOfBirth" TEXT,
    "placeOfBirthCity" TEXT,
    "placeOfBirthProvince" TEXT,
    "placeOfBirthCountry" TEXT,
    "foreignTaxId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "provinceRegionState" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "hasSpanishDni" BOOLEAN NOT NULL DEFAULT false,
    "hasSpanishNie" BOOLEAN NOT NULL DEFAULT false,
    "hasSpanishNif" BOOLEAN NOT NULL DEFAULT false,
    "nifMNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Director_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "legalName" TEXT,
    "tradingName" TEXT,
    "countryOfIncorporation" TEXT,
    "countryCode" TEXT,
    "registrationNumber" TEXT,
    "foreignTaxId" TEXT,
    "vatNumber" TEXT,
    "registeredAddress" TEXT,
    "city" TEXT,
    "provinceRegionState" TEXT,
    "postalCode" TEXT,
    "businessActivity" TEXT,
    "website" TEXT,
    "marketplaceUsed" TEXT,
    "sellsInSpain" BOOLEAN NOT NULL DEFAULT false,
    "sellsInEu" BOOLEAN NOT NULL DEFAULT false,
    "usesAmazonFba" BOOLEAN NOT NULL DEFAULT false,
    "storesInventoryInSpain" BOOLEAN NOT NULL DEFAULT false,
    "performsIntracommunityB2b" BOOLEAN NOT NULL DEFAULT false,
    "alreadyHasSpanishNif" BOOLEAN NOT NULL DEFAULT false,
    "alreadyHasVatNumber" BOOLEAN NOT NULL DEFAULT false,
    "needsRoiVies" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "fullNameOrCompanyName" TEXT,
    "nif" TEXT,
    "residentInSpain" BOOLEAN,
    "representationType" TEXT,
    "representationTitle" TEXT,
    "powerOfAttorneyPresent" BOOLEAN NOT NULL DEFAULT false,
    "authorizationScopeSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Representative_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "documentType" TEXT,
    "documentName" TEXT,
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "externalUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidenceScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'CASE',
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "value" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'AI_INFERENCE',
    "sourceFileName" TEXT,
    "sourceExcerpt" TEXT,
    "confidenceScore" REAL NOT NULL DEFAULT 0,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "analystCorrectedValue" TEXT,
    "analystApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtractedField_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Modelo030Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "draftJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "warningsJson" JSONB NOT NULL DEFAULT [],
    "missingFieldsJson" JSONB NOT NULL DEFAULT [],
    "sourceReferencesJson" JSONB NOT NULL DEFAULT [],
    "humanReviewStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    CONSTRAINT "Modelo030Draft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Modelo036Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "draftJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "warningsJson" JSONB NOT NULL DEFAULT [],
    "missingFieldsJson" JSONB NOT NULL DEFAULT [],
    "sourceReferencesJson" JSONB NOT NULL DEFAULT [],
    "humanReviewStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    CONSTRAINT "Modelo036Draft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Approval_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "inputSummary" TEXT,
    "modelUsed" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "structuredOutput" JSONB,
    "confidenceScore" REAL,
    "warnings" JSONB NOT NULL DEFAULT [],
    "missingInformation" JSONB NOT NULL DEFAULT [],
    "inconsistencies" JSONB NOT NULL DEFAULT [],
    "processingTimeMs" INTEGER,
    "reviewedByHuman" BOOLEAN NOT NULL DEFAULT false,
    "humanCorrectionsSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailIngestionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "fromEmail" TEXT,
    "subject" TEXT,
    "receivedAt" DATETIME,
    "bodySummary" TEXT,
    "attachmentsCount" INTEGER NOT NULL DEFAULT 0,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailIngestionLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmIngestionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "crmName" TEXT,
    "externalRecordId" TEXT,
    "payloadJson" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmIngestionLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmissionEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "receiptFilePath" TEXT,
    "receiptNumber" TEXT,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionEvidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Director_caseId_key" ON "Director"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_caseId_key" ON "Company"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Representative_caseId_key" ON "Representative"("caseId");

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");

-- CreateIndex
CREATE INDEX "ExtractedField_caseId_idx" ON "ExtractedField"("caseId");

-- CreateIndex
CREATE INDEX "ExtractedField_fieldKey_idx" ON "ExtractedField"("fieldKey");

-- CreateIndex
CREATE INDEX "Modelo030Draft_caseId_idx" ON "Modelo030Draft"("caseId");

-- CreateIndex
CREATE INDEX "Modelo036Draft_caseId_idx" ON "Modelo036Draft"("caseId");

-- CreateIndex
CREATE INDEX "ChecklistItem_caseId_idx" ON "ChecklistItem"("caseId");

-- CreateIndex
CREATE INDEX "InternalNote_caseId_idx" ON "InternalNote"("caseId");

-- CreateIndex
CREATE INDEX "Approval_caseId_idx" ON "Approval"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_caseId_idx" ON "AuditLog"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AiRun_caseId_idx" ON "AiRun"("caseId");

-- CreateIndex
CREATE INDEX "EmailIngestionLog_caseId_idx" ON "EmailIngestionLog"("caseId");

-- CreateIndex
CREATE INDEX "CrmIngestionLog_caseId_idx" ON "CrmIngestionLog"("caseId");

-- CreateIndex
CREATE INDEX "SubmissionEvidence_caseId_idx" ON "SubmissionEvidence"("caseId");
