interface MissingFieldsAlertProps {
  missingFields: string[];
  fieldLabels?: Record<string, string>;
}

export function MissingFieldsAlert({
  missingFields,
  fieldLabels = {},
}: MissingFieldsAlertProps) {
  if (missingFields.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Todos los campos obligatorios están presentes. Listo para revisión y aprobación humana.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">
        Faltan {missingFields.length} campo(s) obligatorio(s)
      </p>
      <ul className="mt-2 list-disc list-inside text-sm text-amber-800 space-y-1">
        {missingFields.map((key) => (
          <li key={key}>{fieldLabels[key] ?? key}</li>
        ))}
      </ul>
    </div>
  );
}
