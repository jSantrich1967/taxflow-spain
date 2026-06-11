"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runExtractionAction } from "@/app/actions/cases";

interface RunExtractionButtonProps {
  caseId: string;
}

export function RunExtractionButton({ caseId }: RunExtractionButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const result = await runExtractionAction(caseId);
      if (!result.success) {
        setError(result.error ?? "Extraction failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRun}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Running AI extraction…
          </>
        ) : (
          <>🤖 Run AI Extraction</>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 max-w-md">{error}</p>
      )}
    </div>
  );
}
