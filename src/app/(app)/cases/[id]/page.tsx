import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { RunExtractionButton } from "@/components/review/RunExtractionButton";
import { DocumentUploadForm } from "@/components/cases/DocumentUploadForm";
import { getCaseById } from "@/lib/services/caseService";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);

  if (!caseRecord) notFound();

  const latestAiRun = caseRecord.aiRuns[0];
  const approvedFields = caseRecord.extractedFields.filter((f) => f.analystApproved).length;
  const pendingFields = caseRecord.extractedFields.filter(
    (f) => f.requiresHumanReview && !f.analystApproved,
  ).length;

  return (
    <div>
      <PageHeader
        title={caseRecord.caseNumber}
        description={caseRecord.contactName ?? caseRecord.companyName ?? "Caso de flujo fiscal"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cases/${id}/intake`}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Entrada IA
            </Link>
            <Link
              href={`/cases/${id}/aeat-preparation`}
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Preparación AEAT
            </Link>
            <Link
              href={`/cases/${id}/review`}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Revisión IA →
            </Link>
            {caseRecord.requiresModelo030 && (
              <Link
                href={`/cases/${id}/modelo-030-draft`}
                className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
              >
                Borrador Modelo 030
              </Link>
            )}
            {caseRecord.requiresModelo036 && (
              <Link
                href={`/cases/${id}/modelo-036-draft`}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  caseRecord.modelo036Locked
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                Borrador Modelo 036{caseRecord.modelo036Locked ? " (bloqueado)" : ""}
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Resumen del caso</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Estado</dt>
                <dd className="mt-1">
                  <CaseStatusBadge status={caseRecord.status} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Analista asignado</dt>
                <dd className="mt-1 font-medium">{caseRecord.assignedAnalyst ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email del contacto</dt>
                <dd className="mt-1">{caseRecord.contactEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Teléfono del contacto</dt>
                <dd className="mt-1">{caseRecord.contactPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Empresa</dt>
                <dd className="mt-1">{caseRecord.companyName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">País</dt>
                <dd className="mt-1">{caseRecord.companyCountry ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {caseRecord.requiresModelo030 && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  Modelo 030 requerido
                </span>
              )}
              {caseRecord.requiresModelo036 && (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                  Modelo 036 requerido
                </span>
              )}
              {caseRecord.vatReviewRequired && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  Revisión de IVA
                </span>
              )}
              {caseRecord.roiReviewRequired && (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                  ROI / VIES
                </span>
              )}
              {caseRecord.modelo036Locked && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  Modelo 036 bloqueado
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Extracción con IA</h2>
            <RunExtractionButton caseId={id} />
            {latestAiRun && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                <p>
                  <span className="text-slate-500">Última ejecución:</span>{" "}
                  {new Date(latestAiRun.createdAt).toLocaleString()}
                </p>
                <p>
                  <span className="text-slate-500">Modelo:</span> {latestAiRun.modelUsed}
                </p>
                {latestAiRun.confidenceScore != null && (
                  <p>
                    <span className="text-slate-500">Confianza:</span>{" "}
                    {Math.round(latestAiRun.confidenceScore * 100)}%
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Procesamiento:</span>{" "}
                  {latestAiRun.processingTimeMs}ms
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Documentos</h2>
            <DocumentUploadForm caseId={id} />
            {caseRecord.documents.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {caseRecord.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{doc.originalFileName}</p>
                      <p className="text-xs text-slate-500">
                        {doc.documentType} · {doc.status}
                        {doc.aiProcessed && " · procesado por IA"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Todavía no hay documentos subidos.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Progreso de revisión</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Campos extraídos</span>
                <span className="font-medium">{caseRecord.extractedFields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aprobados</span>
                <span className="font-medium text-green-600">{approvedFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pendientes de revisión</span>
                <span className="font-medium text-amber-600">{pendingFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elementos de checklist</span>
                <span className="font-medium">{caseRecord.checklistItems.length}</span>
              </div>
            </div>
          </div>

          {caseRecord.checklistItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Checklist</h2>
              <ul className="space-y-2">
                {caseRecord.checklistItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700">{item.documentName}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Historial de auditoría</h2>
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {caseRecord.auditLogs.map((log) => (
                <li key={log.id} className="text-xs">
                  <p className="font-medium text-slate-700">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-slate-400">
                    {log.userName} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
