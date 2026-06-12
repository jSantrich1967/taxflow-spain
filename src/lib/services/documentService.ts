import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/services/auditService";
import {
  buildCaseStorageKey,
  getStorageProvider,
} from "@/lib/storage/storageFactory";
import { DocumentStatus } from "@/generated/prisma/client";

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export interface UploadDocumentInput {
  caseId: string;
  caseNumber: string;
  file: File;
  documentType?: string;
  uploadedBy?: string;
}

export interface UploadDocumentResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export function validateUploadFile(file: File): string | null {
  const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File exceeds maximum size of ${MAX_UPLOAD_SIZE_MB}MB`;
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `File type not allowed: ${ext}`;
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return `MIME type not allowed: ${file.type}`;
    }
  }

  return null;
}

/**
 * Save uploaded file via storage provider and persist metadata in DB.
 */
export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<UploadDocumentResult> {
  const validationError = validateUploadFile(input.file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const storage = getStorageProvider();
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const storedName = `${timestamp}_${safeName}`;
  const storageKey = buildCaseStorageKey(input.caseNumber, storedName);

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const stored = await storage.put(storageKey, buffer, {
    contentType: input.file.type || undefined,
  });

  const filePath = stored.absolutePath ?? storage.resolvePath(storageKey);

  const document = await prisma.document.create({
    data: {
      caseId: input.caseId,
      documentType: input.documentType ?? inferDocumentType(safeName),
      documentName: safeName,
      originalFileName: input.file.name,
      filePath,
      status: DocumentStatus.UPLOADED,
      uploadedBy: input.uploadedBy ?? "Analista",
      aiProcessed: false,
    },
  });

  await logAuditEvent({
    caseId: input.caseId,
    userName: input.uploadedBy ?? "Analista",
    action: "DOCUMENT_UPLOADED",
    newValue: input.file.name,
    metadata: { documentId: document.id, documentType: document.documentType },
  });

  return { success: true, documentId: document.id };
}

function inferDocumentType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("passport")) return "passport";
  if (lower.includes("power") || lower.includes("attorney")) return "power_of_attorney";
  if (lower.includes("certificate") || lower.includes("incorporation")) {
    return "incorporation_certificate";
  }
  if (lower.includes("address")) return "proof_of_address";
  return "supporting_document";
}

async function readFileBuffer(filePath: string): Promise<Buffer> {
  const storage = getStorageProvider();
  const baseDir = storage.resolvePath("");

  if (filePath.startsWith(baseDir)) {
    const key = filePath.slice(baseDir.length).replace(/^[/\\]+/, "");
    return storage.get(key);
  }

  try {
    return await storage.get(filePath);
  } catch {
    return fs.readFile(filePath);
  }
}

async function readFileText(filePath: string): Promise<string> {
  const storage = getStorageProvider();
  const baseDir = storage.resolvePath("");

  if (filePath.startsWith(baseDir)) {
    const key = filePath.slice(baseDir.length).replace(/^[/\\]+/, "");
    return storage.readText(key);
  }

  try {
    return await storage.readText(filePath);
  } catch {
    return fs.readFile(filePath, "utf-8");
  }
}

/**
 * Extract readable text from a stored document for AI processing.
 */
export async function extractTextFromDocument(
  filePath: string,
  originalFileName: string,
): Promise<string> {
  const ext = path.extname(originalFileName).toLowerCase();

  if ([".txt", ".md", ".json"].includes(ext)) {
    const content = await readFileText(filePath);
    return content.slice(0, 50000);
  }

  if (ext === ".pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const buffer = await readFileBuffer(filePath);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return (result.text ?? "").slice(0, 50000);
    } catch {
      return `[PDF uploaded: ${originalFileName} — text extraction unavailable. Review file manually.]`;
    }
  }

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return `[Image uploaded: ${originalFileName} — visual content; refer to file during review.]`;
  }

  return `[Document uploaded: ${originalFileName}]`;
}

export async function gatherDocumentTextsForCase(caseId: string) {
  const documents = await prisma.document.findMany({
    where: { caseId },
    orderBy: { uploadedAt: "asc" },
  });

  const texts: Array<{ fileName: string; content: string; documentId: string }> = [];

  for (const doc of documents) {
    const content = await extractTextFromDocument(doc.filePath, doc.originalFileName);
    texts.push({
      fileName: doc.originalFileName,
      content,
      documentId: doc.id,
    });
  }

  return texts;
}
