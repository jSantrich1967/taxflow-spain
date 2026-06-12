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
        setError(result.error ?? "La aprobación falló");
        return;
      }
      router.refresh();
    });
  }

  if (isApproved) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="text-sm font-semibold text-green-900">Borrador aprobado</h3>
        <p className="mt-1 text-sm text-green-700">
          Borrador interno Modelo {draftType} aprobado por {approvedBy ?? "Analista"}
          {approvedAt && ` el ${new Date(approvedAt).toLocaleString()}`}.
        </p>
        <p className="mt-2 text-xs text-green-600">
          Este es solo un borrador interno, no un envío oficial a la AEAT.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">Aprobación humana</h3>
      <p className="text-sm text-slate-600 mb-4">
        Aprueba este borrador interno Modelo {draftType} después de verificar todos los campos.
        El envío oficial a AEAT requiere un paso manual separado.
      </p>

      <label className="block text-xs font-medium text-slate-600 mb-1">
        Notas de aprobación (opcional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4"
        placeholder="Notas del analista para el historial de auditoría..."
        disabled={isPending}
      />

      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending || missingFieldsCount > 0}
        className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Aprobando..." : `Aprobar borrador Modelo ${draftType}`}
      </button>

      {missingFieldsCount > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          Completa todos los campos obligatorios antes de aprobar ({missingFieldsCount} faltantes).
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
