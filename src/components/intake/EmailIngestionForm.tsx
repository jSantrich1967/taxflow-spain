"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ingestEmailAction } from "@/app/actions/intake";

interface EmailIngestionFormProps {
  caseId: string;
}

export function EmailIngestionForm({ caseId }: EmailIngestionFormProps) {
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
      const result = await ingestEmailAction(caseId, formData);
      if (!result.success) {
        setError(result.error ?? "No se pudo ingerir el email");
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
          <label className="block text-xs font-medium text-slate-600 mb-1">De</label>
          <input
            name="fromEmail"
            type="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="client@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Asunto</label>
          <input
            name="subject"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Cuerpo del email *</label>
        <textarea
          name="bodyText"
          required
          rows={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
          placeholder="Pega el contenido completo del email..."
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="runExtraction" defaultChecked />
        Ejecutar extracción con IA después de ingerir
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Ingiriendo..." : "Ingerir email"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Email ingerido correctamente.</p>
      )}
    </form>
  );
}
