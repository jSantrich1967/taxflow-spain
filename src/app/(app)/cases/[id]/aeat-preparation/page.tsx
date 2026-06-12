import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { ReadinessChecklist } from "@/components/aeat/ReadinessChecklist";
import { SubmissionEvidenceForm } from "@/components/aeat/SubmissionEvidenceForm";
import { getAeatPreparationStatus } from "@/lib/services/aeatPreparationService";

interface AeatPreparationPageProps {
  params: Promise<{ id: string }>;
}

export default async function AeatPreparationPage({ params }: AeatPreparationPageProps) {
  const { id } = await params;
  const status = await getAeatPreparationStatus(id);
  if (!status) notFound();

  const defaultSubmissionType = status.modelo030.required
    ? "MODELO_030"
    : status.modelo036.required
      ? "MODELO_036"
      : "MODELO_030";

  return (
    <div>
      <PageHeader
        title={`Preparación AEAT — ${status.caseNumber}`}
        description="Preparación para envío manual: TaxFlow Spain NO envía a la AEAT automáticamente"
        actions={
          <div className="flex gap-2">
            {status.modelo030.required && (
              <Link
                href={`/cases/${id}/modelo-030-draft`}
                className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700 hover:bg-purple-100"
              >
                Borrador Modelo 030
              </Link>
            )}
            {status.modelo036.required && (
              <Link
                href={`/cases/${id}/modelo-036-draft`}
                className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 hover:bg-teal-100"
              >
                Borrador Modelo 036
              </Link>
            )}
            <Link
              href={`/cases/${id}`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← Caso
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <CaseStatusBadge status={status.caseStatus} />
      </div>

      <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
        <strong>No hay envío automático.</strong> Esta página prepara materiales y registra
        evidencia después de que una persona envíe manualmente vía sede electrónica de AEAT
        o canal autorizado. La IA y los borradores son solo referencia, no documentos finales legales.
      </div>

      <div className="mb-6">
        <ReadinessChecklist
          checks={status.checks}
          ready={status.readyForManualSubmission}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Estado de borradores</h3>
          <dl className="space-y-2 text-sm">
            {status.modelo030.required && (
              <>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Modelo 030</dt>
                  <dd className={status.modelo030.draftApproved ? "text-green-600 font-medium" : "text-amber-600"}>
                    {status.modelo030.draftApproved ? "Aprobado" : status.modelo030.draftStatus ?? "No generado"}
                  </dd>
                </div>
                {status.modelo030.missingFields.length > 0 && (
                  <p className="text-xs text-amber-600">
                    {status.modelo030.missingFields.length} campo(s) faltantes en el borrador
                  </p>
                )}
              </>
            )}
            {status.modelo036.required && (
              <>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Modelo 036</dt>
                  <dd className={status.modelo036.draftApproved ? "text-green-600 font-medium" : "text-amber-600"}>
                    {status.modelo036.locked
                      ? "Bloqueado"
                      : status.modelo036.draftApproved
                        ? "Aprobado"
                        : status.modelo036.draftStatus ?? "No generado"}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Campos y checklist</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Campos aprobados</dt>
              <dd>{status.fields.approved} / {status.fields.total}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Pendientes de revisión</dt>
              <dd className={status.fields.pendingReview > 0 ? "text-amber-600" : ""}>
                {status.fields.pendingReview}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Checklist</dt>
              <dd>{status.checklist.completed} / {status.checklist.total}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Documentos</dt>
              <dd>{status.documents.total} ({status.documents.approved} aprobados)</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Paquetes de revisión</h3>
          <div className="space-y-2">
            {status.modelo030.required && (
              <Link
                href={`/cases/${id}/review-pack/modelo-030`}
                className="block text-sm text-blue-600 hover:underline"
              >
                Paquete de revisión Modelo 030 →
              </Link>
            )}
            {status.modelo036.required && (
              <Link
                href={`/cases/${id}/review-pack/modelo-036`}
                className="block text-sm text-blue-600 hover:underline"
              >
                Paquete de revisión Modelo 036 →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Instrucciones para envío manual a AEAT
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
          {status.manualInstructions.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Registrar evidencia de envío
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Después de enviar manualmente vía AEAT, sube aquí el justificante y el número de referencia.
        </p>
        <SubmissionEvidenceForm caseId={id} defaultType={defaultSubmissionType} />
      </div>

      {status.submissionEvidence.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Historial de evidencias de envío
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Justificante #</th>
                <th className="pb-2">Enviado por</th>
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {status.submissionEvidence.map((ev) => (
                <tr key={ev.id}>
                  <td className="py-2">{ev.submissionType}</td>
                  <td className="py-2">{ev.receiptNumber ?? "—"}</td>
                  <td className="py-2">{ev.submittedBy ?? "—"}</td>
                  <td className="py-2 text-xs">
                    {ev.submittedAt
                      ? new Date(ev.submittedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2 text-xs text-slate-500">{ev.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
