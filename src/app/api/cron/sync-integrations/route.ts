import { NextResponse } from "next/server";
import { runAllIntegrationSyncs } from "@/lib/services/integrationSyncService";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runAllIntegrationSyncs();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    summary,
  });
}
