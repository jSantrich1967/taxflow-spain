import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  GMAIL_SCOPES,
  getGoogleOAuthClient,
} from "@/lib/integrations/googleOAuth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const oauth2 = getGoogleOAuthClient();
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GMAIL_SCOPES,
    });
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gmail OAuth not configured",
      },
      { status: 500 },
    );
  }
}
