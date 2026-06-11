import { NextRequest, NextResponse } from "next/server";
import {
  processWebhookIngestion,
  WebhookPayload,
} from "@/lib/services/webhookIngestionService";

/**
 * POST /api/webhooks/ingest
 * Generic webhook endpoint for CRM/email intake.
 * Optional header: x-webhook-secret (matches WEBHOOK_SECRET env)
 */
export async function POST(request: NextRequest) {
  try {
    const secret =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    let payload: WebhookPayload;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as WebhookPayload;
    } else {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 400 },
      );
    }

    const result = await processWebhookIngestion(payload, { secret });

    if (!result.success) {
      return NextResponse.json(result, { status: result.error?.includes("secret") ? 401 : 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TaxFlow Spain Webhook Ingestion",
    status: "active",
    usage: "POST JSON payload to this endpoint",
    documentation: "See README Phase 5 webhook section",
  });
}
