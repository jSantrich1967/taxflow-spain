import { google } from "googleapis";
import prisma from "@/lib/db";
import { getGoogleOAuthClient } from "@/lib/integrations/googleOAuth";
import { runIntakeExtraction } from "@/lib/services/aiIntakeService";
import { createCase } from "@/lib/services/caseService";
import { ingestEmail } from "@/lib/services/emailIngestionService";
import {
  getIntegrationAccount,
  isExternalRecordProcessed,
  markExternalRecordProcessed,
  upsertIntegrationAccount,
} from "@/lib/services/integrationAccountService";

export interface GmailSyncResult {
  success: boolean;
  processed: number;
  createdCases: number;
  errors: string[];
}

function shouldAutoExtract(): boolean {
  return process.env.AUTO_EXTRACT_ON_INGEST !== "false";
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractEmailAddress(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

function extractEmailBody(payload: {
  mimeType?: string | null;
  body?: { data?: string | null };
  parts?: Array<{
    mimeType?: string | null;
    body?: { data?: string | null };
    parts?: unknown[];
  }>;
}): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }

  for (const part of payload.parts ?? []) {
    if (part.mimeType === "text/html" && part.body?.data) {
      return decodeBase64Url(part.body.data).replace(/<[^>]+>/g, " ");
    }
  }

  return "";
}

async function getAuthorizedGmailClient() {
  const account = await getIntegrationAccount("GMAIL");
  if (!account?.refreshToken || !account.isActive) {
    throw new Error("Gmail no está conectado");
  }

  const oauth2 = getGoogleOAuthClient();
  oauth2.setCredentials({
    access_token: account.accessToken ?? undefined,
    refresh_token: account.refreshToken,
    expiry_date: account.expiresAt?.getTime(),
  });

  oauth2.on("tokens", async (tokens) => {
    await upsertIntegrationAccount("GMAIL", {
      accessToken: tokens.access_token ?? account.accessToken,
      refreshToken: tokens.refresh_token ?? account.refreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });
  });

  return google.gmail({ version: "v1", auth: oauth2 });
}

export async function syncGmailInbox(): Promise<GmailSyncResult> {
  const result: GmailSyncResult = {
    success: true,
    processed: 0,
    createdCases: 0,
    errors: [],
  };

  try {
    const gmail = await getAuthorizedGmailClient();
    const query =
      process.env.GMAIL_SYNC_QUERY ?? "is:unread newer_than:7d";

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Number(process.env.GMAIL_SYNC_MAX ?? 20),
    });

    const messages = listResponse.data.messages ?? [];

    for (const message of messages) {
      if (!message.id) continue;

      const externalId = message.id;
      if (await isExternalRecordProcessed("gmail", externalId)) {
        continue;
      }

      try {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: externalId,
          format: "full",
        });

        const headers = full.data.payload?.headers ?? [];
        const fromHeader = headers.find((h) => h.name === "From")?.value;
        const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
        const fromEmail = extractEmailAddress(fromHeader);
        const bodyText = extractEmailBody(full.data.payload ?? {});

        if (!bodyText.trim()) {
          result.errors.push(`Message ${externalId}: empty body`);
          continue;
        }

        let caseRecord = fromEmail
          ? await prisma.case.findFirst({
              where: { contactEmail: fromEmail },
              orderBy: { updatedAt: "desc" },
            })
          : null;

        if (!caseRecord) {
          caseRecord = await createCase({
            contactEmail: fromEmail,
            contactName: fromHeader?.replace(/<[^>]+>/, "").trim() || undefined,
            manualNotes: `Creado automáticamente desde el mensaje de Gmail ${externalId}`,
          });
          result.createdCases += 1;
        }

        await ingestEmail({
          caseId: caseRecord.id,
          fromEmail,
          subject,
          bodyText,
          userName: "Gmail Sync",
        });

        if (shouldAutoExtract()) {
          const extraction = await runIntakeExtraction({
            caseId: caseRecord.id,
            userName: "Gmail Sync",
          });
          if (!extraction.success) {
            result.errors.push(
              `Mensaje ${externalId}: la extracción falló — ${extraction.error}`,
            );
          }
        }

        await markExternalRecordProcessed("gmail", externalId, caseRecord.id);
        result.processed += 1;
      } catch (error) {
        result.errors.push(
          `Mensaje ${externalId}: ${error instanceof Error ? error.message : "error desconocido"}`,
        );
      }
    }

    await upsertIntegrationAccount("GMAIL", {
      lastSyncAt: new Date(),
      lastSyncError: result.errors[0] ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La sincronización de Gmail falló";
    await upsertIntegrationAccount("GMAIL", {
      lastSyncError: message,
    });
    return { success: false, processed: 0, createdCases: 0, errors: [message] };
  }

  return result;
}
