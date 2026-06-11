"use client";

import { useState } from "react";
import {
  anonymizeCaseAction,
  exportCaseDataAction,
} from "@/app/actions/gdpr";

export function GdprCaseTools() {
  const [caseId, setCaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!caseId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await exportCaseDataAction(caseId.trim());
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `gdpr-export-${data.caseNumber}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Export downloaded successfully.");
    } catch {
      setMessage("Export failed. Check case ID and admin permissions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnonymize() {
    if (!caseId.trim()) return;
    if (
      !window.confirm(
        "This will redact personal data for the case. Continue?",
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await anonymizeCaseAction(caseId.trim());
      setMessage(
        result.success
          ? "Case anonymized successfully."
          : result.error ?? "Anonymization failed.",
      );
    } catch {
      setMessage("Anonymization failed. Check permissions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">GDPR tools</h2>
      <p className="mt-1 text-sm text-slate-600">
        Export or anonymize data for a specific case (admin only)
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="gdpr-case-id" className="block text-sm font-medium text-slate-700">
            Case ID
          </label>
          <input
            id="gdpr-case-id"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
            placeholder="Paste case cuid..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={loading || !caseId.trim()}
          onClick={handleExport}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          type="button"
          disabled={loading || !caseId.trim()}
          onClick={handleAnonymize}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Anonymize
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-slate-600" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
