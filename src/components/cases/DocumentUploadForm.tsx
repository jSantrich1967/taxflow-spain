"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadCaseDocumentAction } from "@/app/actions/cases";

interface DocumentUploadFormProps {
  caseId: string;
}

export function DocumentUploadForm({ caseId }: DocumentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await uploadCaseDocumentAction(caseId, formData);
      if (!result.success) {
        setError(result.error ?? "La subida falló");
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Tipo de documento
        </label>
        <select
          name="documentType"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="passport">Pasaporte</option>
          <option value="proof_of_address">Prueba de domicilio</option>
          <option value="power_of_attorney">Poder de representación</option>
          <option value="incorporation_certificate">Certificado de constitución</option>
          <option value="supporting_document">Documento de soporte</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Archivo</label>
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.txt,.md,.json,.jpg,.jpeg,.png,.webp"
          className="text-sm"
          disabled={isPending}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
      >
        {isPending ? "Subiendo..." : "Subir"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
