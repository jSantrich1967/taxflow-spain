"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DraftApprovalPanelProps {
  caseId: string;
  draftId: string;
  draftType: "030" | "036";
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  missingFieldsCount: number;
  approveAction: (
    caseId: string,
    draftId: string,
    notes?: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    missingFields?: string[];
  }>;
}

export function DraftApprovalPanel({
  caseId,
  draftId,
  draftType,
  isApproved,
  approvedBy,
  approvedAt,
  missingFieldsCount,
  approveAction,
}: DraftApprovalPanelProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveAction(caseId, draftId, notes || undefined);
      if (!result.success) {
        setError(result.error ?? "Approval failed");
        return;
      }
      router.refresh();
    });
  }

  if (isApproved) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="text-sm font-semibold text-green-900">Draft Approved</h3>
        <p className="mt-1 text-sm text-green-700">
          Modelo {draftType} internal draft approved by {approvedBy ?? "Analyst"}
          {approvedAt && ` on ${new Date(approvedAt).toLocaleString()}`}.
        </p>
        <p className="mt-2 text-xs text-green-600">
          This is an internal draft only — not an official AEAT submission.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">Human Approval</h3>
      <p className="text-sm text-slate-600 mb-4">
        Approve this internal Modelo {draftType} draft after verifying all fields.
        Official AEAT submission requires a separate manual step.
      </p>

      <label className="block text-xs font-medium text-slate-600 mb-1">
        Approval notes (optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4"
        placeholder="Analyst notes for audit trail…"
        disabled={isPending}
      />

      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending || missingFieldsCount > 0}
        className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Approving…" : `Approve Modelo ${draftType} Draft`}
      </button>

      {missingFieldsCount > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          Complete all required fields before approval ({missingFieldsCount} missing).
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
