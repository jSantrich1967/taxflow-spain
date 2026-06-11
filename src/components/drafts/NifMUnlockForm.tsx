"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNifMReceivedAction } from "@/app/actions/drafts";

interface NifMUnlockFormProps {
  caseId: string;
  nifMReceived: boolean;
}

export function NifMUnlockForm({ caseId, nifMReceived }: NifMUnlockFormProps) {
  const [nifMNumber, setNifMNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (nifMReceived) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        NIF M received — Modelo 036 is unlocked.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await markNifMReceivedAction(caseId, nifMNumber);
      if (!result.success) {
        setError("Failed to mark NIF M as received");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <p className="text-sm font-semibold text-red-900 mb-2">
        Modelo 036 Locked
      </p>
      <p className="text-xs text-red-700 mb-3">
        Enter the NIF M number received from AEAT to unlock Modelo 036.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={nifMNumber}
          onChange={(e) => setNifMNumber(e.target.value)}
          placeholder="NIF M number"
          required
          className="rounded-md border border-red-200 px-3 py-2 text-sm"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          Mark NIF M Received
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
