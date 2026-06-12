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
      setMessage("Exportación descargada correctamente.");
    } catch {
      setMessage("La exportación falló. Revisa el ID del caso y los permisos de administrador.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnonymize() {
    if (!caseId.trim()) return;
    if (
      !window.confirm(
        "Esto ocultará los datos personales del caso. ¿Quieres continuar?",
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
          ? "Caso anonimizado correctamente."
          : result.error ?? "La anonimización falló.",
      );
    } catch {
      setMessage("La anonimización falló. Revisa los permisos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Herramientas GDPR</h2>
      <p className="mt-1 text-sm text-slate-600">
        Exporta o anonimiza datos de un caso específico (solo administradores)
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="gdpr-case-id" className="block text-sm font-medium text-slate-700">
            ID del caso
          </label>
          <input
            id="gdpr-case-id"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
            placeholder="Pega el cuid del caso..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={loading || !caseId.trim()}
          onClick={handleExport}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Exportar JSON
        </button>
        <button
          type="button"
          disabled={loading || !caseId.trim()}
          onClick={handleAnonymize}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Anonimizar
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
