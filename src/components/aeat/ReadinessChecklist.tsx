import { AeatReadinessCheck } from "@/lib/services/aeatPreparationService";

interface ReadinessChecklistProps {
  checks: AeatReadinessCheck[];
  ready: boolean;
}

export function ReadinessChecklist({ checks, ready }: ReadinessChecklistProps) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        ready
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <h3
        className={`text-sm font-semibold mb-3 ${
          ready ? "text-green-900" : "text-amber-900"
        }`}
      >
        {ready
          ? "✓ Listo para preparar el envío manual a AEAT"
          : "Todavía no está listo: completa los elementos de abajo"}
      </h3>
      <ul className="space-y-2">
        {checks.map((check, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 shrink-0 ${
                check.passed ? "text-green-600" : "text-amber-600"
              }`}
            >
              {check.passed ? "✓" : "○"}
            </span>
            <div>
              <p className="font-medium text-slate-800">{check.label}</p>
              <p className="text-xs text-slate-500">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
