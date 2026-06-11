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
        All required fields are present. Ready for human approval review.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">
        {missingFields.length} required field(s) missing
      </p>
      <ul className="mt-2 list-disc list-inside text-sm text-amber-800 space-y-1">
        {missingFields.map((key) => (
          <li key={key}>{fieldLabels[key] ?? key}</li>
        ))}
      </ul>
    </div>
  );
}
