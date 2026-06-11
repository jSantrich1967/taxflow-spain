"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ingestCrmAction } from "@/app/actions/intake";

interface CrmIngestionFormProps {
  caseId: string;
}

export function CrmIngestionForm({ caseId }: CrmIngestionFormProps) {
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
      const result = await ingestCrmAction(caseId, formData);
      if (!result.success) {
        setError(result.error ?? "Failed to ingest CRM record");
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
          <label className="block text-xs font-medium text-slate-600 mb-1">CRM Source</label>
          <select
            name="crmName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="manual_import">Manual Import</option>
            <option value="hubspot">HubSpot</option>
            <option value="salesforce">Salesforce</option>
            <option value="zoho">Zoho CRM</option>
            <option value="generic">Generic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            External Record ID
          </label>
          <input
            name="externalRecordId"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="CRM record ID (optional)"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">CRM JSON *</label>
        <textarea
          name="crmJson"
          required
          rows={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
          placeholder='{"contact_name": "John Smith", "company_name": "Acme Ltd", ...}'
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="runExtraction" defaultChecked />
        Run AI extraction after ingest
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Importing…" : "Import CRM Record"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">CRM record imported successfully.</p>
      )}
    </form>
  );
}
