import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient, getAppBaseUrl } from "@/lib/integrations/googleOAuth";
import { upsertIntegrationAccount } from "@/lib/services/integrationAccountService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/integrations?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/integrations?error=missing_code`,
    );
  }

  try {
    const oauth2 = getGoogleOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const profile = await oauth2Api.userinfo.get();
    const email = profile.data.email ?? undefined;

    await upsertIntegrationAccount("GMAIL", {
      label: email ?? "Gmail",
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      metadataJson: { email },
      isActive: true,
      lastSyncError: null,
    });

    return NextResponse.redirect(
      `${getAppBaseUrl()}/integrations?connected=gmail`,
    );
  } catch (callbackError) {
    const message =
      callbackError instanceof Error ? callbackError.message : "oauth_failed";
    return NextResponse.redirect(
      `${getAppBaseUrl()}/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
