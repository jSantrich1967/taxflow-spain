interface DraftWarningsPanelProps {
  warnings: string[];
}

export function DraftWarningsPanel({ warnings }: DraftWarningsPanelProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Advertencias</h3>
      <ul className="space-y-1 text-sm text-slate-600">
        {warnings.map((warning, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-500">⚠</span>
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
