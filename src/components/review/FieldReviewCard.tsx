"use client";

import { useState, useTransition } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import {
  updateFieldAction,
  approveFieldAction,
  rejectFieldAction,
} from "@/app/actions/fields";

interface ExtractedFieldData {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string | null;
  sourceType: string;
  sourceFileName: string | null;
  sourceExcerpt: string | null;
  confidenceScore: number;
  requiresHumanReview: boolean;
  analystCorrectedValue: string | null;
  analystApproved: boolean;
  approvedBy: string | null;
}

interface FieldReviewCardProps {
  field: ExtractedFieldData;
  caseId: string;
}

export function FieldReviewCard({ field, caseId }: FieldReviewCardProps) {
  const effectiveValue = field.analystCorrectedValue ?? field.value ?? "";
  const [editValue, setEditValue] = useState(effectiveValue);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      const result = await updateFieldAction(field.id, caseId, editValue);
      setMessage(result.success ? "Saved" : result.error ?? "Error");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  function handleApprove() {
    startTransition(async () => {
      await approveFieldAction(field.id, caseId);
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectFieldAction(field.id, caseId);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        field.analystApproved
          ? "border-green-200"
          : field.requiresHumanReview
            ? "border-amber-200"
            : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {field.fieldKey}
          </p>
          <h3 className="text-sm font-semibold text-slate-900">{field.fieldLabel}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfidenceBadge score={field.confidenceScore} />
          {field.requiresHumanReview && !field.analystApproved && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Review required
            </span>
          )}
          {field.analystApproved && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Approved
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">AI extracted value</label>
        <p className="text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
          {field.value || <em className="text-slate-400">Empty</em>}
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Analyst value (editable)
        </label>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isPending}
        />
      </div>

      {(field.sourceFileName || field.sourceExcerpt) && (
        <div className="mb-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <p>
            <span className="font-medium">Source:</span> {field.sourceType}
            {field.sourceFileName && ` — ${field.sourceFileName}`}
          </p>
          {field.sourceExcerpt && (
            <p className="mt-1 italic">&ldquo;{field.sourceExcerpt.slice(0, 200)}&rdquo;</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          Save correction
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending || field.analystApproved}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Approve field
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
        {message && (
          <span className="text-xs text-green-600 self-center">{message}</span>
        )}
      </div>

      {field.approvedBy && (
        <p className="mt-2 text-xs text-slate-400">Approved by {field.approvedBy}</p>
      )}
    </div>
  );
}
