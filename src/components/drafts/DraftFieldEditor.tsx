"use client";

import { useState, useTransition } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { DraftField } from "@/lib/types";

interface DraftFieldEditorProps {
  fieldKey: string;
  field: DraftField;
  caseId: string;
  draftId: string;
  isApproved: boolean;
  updateAction: (
    caseId: string,
    draftId: string,
    fieldKey: string,
    value: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function DraftFieldEditor({
  fieldKey,
  field,
  caseId,
  draftId,
  isApproved,
  updateAction,
}: DraftFieldEditorProps) {
  const displayValue =
    field.value === null || field.value === undefined
      ? ""
      : typeof field.value === "boolean"
        ? field.value
          ? "Sí"
          : "No"
        : String(field.value);

  const [editValue, setEditValue] = useState(displayValue);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMissing = !displayValue.toString().trim() && typeof field.value !== "boolean";

  function handleSave() {
    startTransition(async () => {
      const result = await updateAction(caseId, draftId, fieldKey, editValue);
      setMessage(result.success ? "Guardado" : result.error ?? "Error");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        isMissing
          ? "border-amber-300 bg-amber-50/30"
          : field.requiresReview
            ? "border-amber-200"
            : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs text-slate-500 font-mono">{fieldKey}</p>
          <h4 className="text-sm font-semibold text-slate-900">{field.label}</h4>
        </div>
        <div className="flex gap-2">
          {field.confidenceScore != null && (
            <ConfidenceBadge score={field.confidenceScore} />
          )}
          {isMissing && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Faltante
            </span>
          )}
        </div>
      </div>

      {typeof field.value === "boolean" ? (
        <p className="text-sm text-slate-700 mb-2">{displayValue}</p>
      ) : (
        <>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={isApproved || isPending}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          />
          {!isApproved && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="mt-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Guardar campo
            </button>
          )}
        </>
      )}

      {field.sourceReference && (
        <p className="mt-2 text-xs text-slate-400">Fuente: {field.sourceReference}</p>
      )}
      {message && <p className="mt-1 text-xs text-green-600">{message}</p>}
    </div>
  );
}
