const STATUS_STYLES: Record<string, string> = {
  NEW_CLIENT: "bg-slate-100 text-slate-700",
  INTAKE_RECEIVED: "bg-blue-50 text-blue-700",
  AI_EXTRACTION_PENDING: "bg-yellow-50 text-yellow-800",
  AI_EXTRACTION_COMPLETED: "bg-indigo-50 text-indigo-700",
  ANALYST_REVIEW: "bg-orange-50 text-orange-700",
  MODELO_030_REQUIRED: "bg-purple-50 text-purple-700",
  MODELO_036_ACTIVE: "bg-teal-50 text-teal-700",
  VAT_ROI_REVIEW: "bg-amber-50 text-amber-800",
  COMPLETED: "bg-green-50 text-green-700",
  ON_HOLD: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-50 text-red-700",
};

export function CaseStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
