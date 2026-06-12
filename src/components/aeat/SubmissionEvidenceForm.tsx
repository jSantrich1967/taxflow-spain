"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordSubmissionEvidenceAction } from "@/app/actions/aeat";

interface SubmissionEvidenceFormProps {
  caseId: string;
  defaultType?: string;
}

export function SubmissionEvidenceForm({
  caseId,
  defaultType = "MODELO_030",
}: SubmissionEvidenceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await recordSubmissionEvidenceAction(caseId, formData);
      if (!result.success) {
        setError(result.error ?? "No se pudo registrar la evidencia");
        return;
      }
      setSuccess(true);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Tipo de envío
          </label>
          <select
            name="submissionType"
            defaultValue={defaultType}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="MODELO_030">Modelo 030</option>
            <option value="MODELO_036">Modelo 036</option>
            <option value="VAT">IVA</option>
            <option value="ROI_VIES">ROI / VIES</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Justificante AEAT / número de referencia
          </label>
          <input
            name="receiptNumber"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Número de recibo o justificante"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Enviado por
          </label>
          <input
            name="submittedBy"
            type="text"
            defaultValue="Analista"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Archivo de justificante (PDF/imagen)
          </label>
          <input
            name="receiptFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="w-full text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Notas del envío
        </label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Fecha de envío, canal AEAT utilizado, observaciones..."
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Registrar evidencia de envío"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Evidencia de envío registrada. Esto confirma que el envío manual a AEAT se completó
          fuera de TaxFlow Spain.
        </p>
      )}
    </form>
  );
}
