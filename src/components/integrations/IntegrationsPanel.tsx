"use client";

import { useState } from "react";
import {
  disconnectGmailAction,
  runIntegrationSyncNowAction,
  saveHubSpotTokenAction,
} from "@/app/actions/integrations";

interface IntegrationsPanelProps {
  status: {
    gmail: {
      connected: boolean;
      email: string | null;
      lastSyncAt: string | null;
      lastSyncError: string | null;
    };
    hubspot: {
      connected: boolean;
      lastSyncAt: string | null;
      lastSyncError: string | null;
    };
    autoExtractEnabled: boolean;
    cronConfigured: boolean;
  };
  flash?: {
    connected?: string | null;
    error?: string | null;
  };
}

export function IntegrationsPanel({ status, flash }: IntegrationsPanelProps) {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSyncNow() {
    setLoading(true);
    setSyncMessage(null);
    try {
      const result = await runIntegrationSyncNowAction();
      if (result.success && result.summary) {
        const g = result.summary.gmail;
        const h = result.summary.hubspot;
        setSyncMessage(
          `Gmail: ${g.processed} processed (${g.createdCases} new cases). HubSpot: ${h.processed} processed (${h.createdCases} new cases).`,
        );
      }
    } catch {
      setSyncMessage("Sync failed. Check configuration and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {flash?.connected === "gmail" && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Gmail connected successfully.
        </p>
      )}
      {flash?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {flash.error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Gmail (automatic)</h2>
        <p className="mt-1 text-sm text-slate-600">
          The system reads unread emails, creates/updates cases, and runs AI extraction
          automatically — no manual paste.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            Status:{" "}
            <span className={status.gmail.connected ? "text-green-700" : "text-amber-700"}>
              {status.gmail.connected
                ? `Connected${status.gmail.email ? ` as ${status.gmail.email}` : ""}`
                : "Not connected"}
            </span>
          </p>
          {status.gmail.lastSyncAt && (
            <p className="text-slate-500">
              Last sync: {new Date(status.gmail.lastSyncAt).toLocaleString()}
            </p>
          )}
          {status.gmail.lastSyncError && (
            <p className="text-red-600">Last error: {status.gmail.lastSyncError}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/integrations/gmail/authorize"
            className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {status.gmail.connected ? "Reconnect Gmail" : "Connect Gmail"}
          </a>
          {status.gmail.connected && (
            <form action={disconnectGmailAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Disconnect
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">CRM — HubSpot (automatic)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Syncs HubSpot contacts into cases and runs AI extraction. Use your HubSpot
          Private App access token.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            Status:{" "}
            <span className={status.hubspot.connected ? "text-green-700" : "text-amber-700"}>
              {status.hubspot.connected ? "Token configured" : "Not configured"}
            </span>
          </p>
          {status.hubspot.lastSyncAt && (
            <p className="text-slate-500">
              Last sync: {new Date(status.hubspot.lastSyncAt).toLocaleString()}
            </p>
          )}
          {status.hubspot.lastSyncError && (
            <p className="text-red-600">Last error: {status.hubspot.lastSyncError}</p>
          )}
        </div>

        <form action={saveHubSpotTokenAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="hubspotToken" className="block text-sm font-medium text-slate-700">
              HubSpot Private App Token
            </label>
            <input
              id="hubspotToken"
              name="hubspotToken"
              type="password"
              required
              placeholder="pat-..."
              className="mt-1 w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Save HubSpot Token
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Automatic sync</h2>
        <p className="mt-1 text-sm text-slate-600">
          Auto AI extraction: {status.autoExtractEnabled ? "enabled" : "disabled"}.
          Cron job: {status.cronConfigured ? "configured" : "not configured (use Sync now)"}.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={handleSyncNow}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Syncing..." : "Sync now (Gmail + HubSpot)"}
        </button>
        {syncMessage && (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {syncMessage}
          </p>
        )}
      </section>
    </div>
  );
}
