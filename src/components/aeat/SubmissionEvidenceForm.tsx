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
        setError(result.error ?? "Failed to record evidence");
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
            Submission type
          </label>
          <select
            name="submissionType"
            defaultValue={defaultType}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="MODELO_030">Modelo 030</option>
            <option value="MODELO_036">Modelo 036</option>
            <option value="VAT">VAT</option>
            <option value="ROI_VIES">ROI / VIES</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            AEAT receipt / reference number
          </label>
          <input
            name="receiptNumber"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Receipt or justificante number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Submitted by
          </label>
          <input
            name="submittedBy"
            type="text"
            defaultValue="Analyst"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Receipt file (PDF/image)
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
          Submission notes
        </label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Date submitted, AEAT channel used, any observations…"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Record Submission Evidence"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Submission evidence recorded. This confirms manual AEAT submission was completed
          outside TaxFlow Spain.
        </p>
      )}
    </form>
  );
}
