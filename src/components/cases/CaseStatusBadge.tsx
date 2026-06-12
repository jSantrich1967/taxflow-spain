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

const STATUS_LABELS: Record<string, string> = {
  NEW_CLIENT: "Cliente nuevo",
  INTAKE_RECEIVED: "Entrada recibida",
  AI_EXTRACTION_PENDING: "Extracción IA pendiente",
  AI_EXTRACTION_COMPLETED: "Extracción IA completada",
  WAITING_FOR_CLIENT_INFORMATION: "Esperando información del cliente",
  DOCUMENTS_PENDING: "Documentos pendientes",
  DOCUMENTS_UPLOADED: "Documentos subidos",
  ANALYST_REVIEW: "Revisión de analista",
  MISSING_INFORMATION_REQUESTED: "Información faltante solicitada",
  MODELO_030_REQUIRED: "Modelo 030 requerido",
  MODELO_030_DRAFT_READY: "Borrador 030 listo",
  MODELO_030_APPROVED: "Modelo 030 aprobado",
  MODELO_030_SUBMITTED: "Modelo 030 enviado",
  WAITING_FOR_TAX_AUTHORITY_RESPONSE: "Esperando respuesta tributaria",
  NIF_M_RECEIVED: "NIF M recibido",
  MODELO_036_ACTIVE: "Modelo 036 activo",
  MODELO_036_DRAFT_READY: "Borrador 036 listo",
  MODELO_036_APPROVED: "Modelo 036 aprobado",
  VAT_ROI_REVIEW: "Revisión IVA / ROI",
  VAT_ROI_SUBMITTED: "IVA / ROI enviado",
  COMPLETED: "Completado",
  ON_HOLD: "En pausa",
  REJECTED: "Rechazado",
};

export function CaseStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
