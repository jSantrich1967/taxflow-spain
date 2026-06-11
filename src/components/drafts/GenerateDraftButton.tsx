"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface GenerateDraftButtonProps {
  caseId: string;
  draftType: "030" | "036";
  generateAction: (caseId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  disabled?: boolean;
  disabledReason?: string;
}

export function GenerateDraftButton({
  caseId,
  draftType,
  generateAction,
  disabled,
  disabledReason,
}: GenerateDraftButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateAction(caseId);
      if (!result.success) {
        setError(result.error ?? "Failed to generate draft");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled || isPending}
        title={disabledReason}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Generating…" : `Generate Modelo ${draftType} Draft`}
      </button>
      {disabled && disabledReason && (
        <p className="mt-1 text-xs text-slate-500">{disabledReason}</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
