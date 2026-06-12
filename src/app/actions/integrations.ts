"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/rbac";
import { runAllIntegrationSyncs } from "@/lib/services/integrationSyncService";
import { upsertIntegrationAccount } from "@/lib/services/integrationAccountService";

export async function saveHubSpotTokenAction(formData: FormData) {
  await requireAdmin();

  const token = String(formData.get("hubspotToken") ?? "").trim();
  if (!token) {
    throw new Error("HubSpot token is required");
  }

  await upsertIntegrationAccount("HUBSPOT", {
    label: "HubSpot",
    accessToken: token,
    isActive: true,
    lastSyncError: null,
  });

  revalidatePath("/integrations");
}

export async function disconnectGmailAction() {
  await requireAdmin();

  await upsertIntegrationAccount("GMAIL", {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isActive: false,
    metadataJson: {},
    lastSyncError: null,
  });

  revalidatePath("/integrations");
}

export async function runIntegrationSyncNowAction() {
  await requireAdmin();
  const summary = await runAllIntegrationSyncs();
  revalidatePath("/integrations");
  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true, summary };
}
