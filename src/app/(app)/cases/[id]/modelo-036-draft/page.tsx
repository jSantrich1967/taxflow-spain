import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { GenerateDraftButton } from "@/components/drafts/GenerateDraftButton";
import { DraftFieldEditor } from "@/components/drafts/DraftFieldEditor";
import { DraftApprovalPanel } from "@/components/drafts/DraftApprovalPanel";
import { MissingFieldsAlert } from "@/components/drafts/MissingFieldsAlert";
import { DraftWarningsPanel } from "@/components/drafts/DraftWarningsPanel";
import { NifMUnlockForm } from "@/components/drafts/NifMUnlockForm";
import { getCaseById } from "@/lib/services/caseService";
import { getLatestModelo036Draft } from "@/lib/services/draftService";
import { groupDraftFields, buildFieldLabelMap } from "@/lib/utils/draftGroups";
import {
  generateModelo036DraftAction,
  updateModelo036FieldAction,
  approveModelo036DraftAction,
} from "@/app/actions/drafts";
import { DraftStatus } from "@/generated/prisma/client";

interface Modelo036DraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function Modelo036DraftPage({ params }: Modelo036DraftPageProps) {
  const { id } = await params;
  const [caseRecord, draftData] = await Promise.all([
    getCaseById(id),
    getLatestModelo036Draft(id),
  ]);

  if (!caseRecord) notFound();

  const draft = draftData?.draft;
  const record = draftData?.record;
  const isApproved = record?.status === DraftStatus.APPROVED;
  const isLocked = caseRecord.modelo036Locked;
  const grouped = draft ? groupDraftFields(draft.fields) : [];
  const fieldLabels = draft ? buildFieldLabelMap(draft.fields) : {};

  return (
    <div>
      <PageHeader
        title={`Borrador Modelo 036 — ${caseRecord.caseNumber}`}
        description="Borrador interno para registro fiscal de empresa, no es un envío oficial a AEAT"
        actions={
          <div className="flex gap-2">
            <Link
              href={`/cases/${id}/review`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Revisión IA
            </Link>
            <Link
              href={`/cases/${id}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Caso
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CaseStatusBadge status={caseRecord.status} />
        {isLocked && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Modelo 036 bloqueado
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
        {record && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isApproved
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isApproved ? "Aprobado" : "Borrador pendiente"}
          </span>
        )}
      </div>

      {isLocked && (
        <div className="mb-6">
          <NifMUnlockForm caseId={id} nifMReceived={caseRecord.nifMReceived} />
        </div>
      )}

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Solo borrador interno.</strong> Este documento se prepara para revisión del analista.
        No es legalmente final y no debe enviarse a AEAT sin aprobación humana explícita.
      </div>

      {!draft && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600 mb-2">Todavía no se ha generado el borrador Modelo 036.</p>
          <p className="text-sm text-slate-500 mb-6">
            Ejecuta primero la extracción con IA y revisa los campos; después genera el borrador.
          </p>
          <GenerateDraftButton
            caseId={id}
            draftType="036"
            generateAction={generateModelo036DraftAction}
            disabled={isLocked || !caseRecord.requiresModelo036}
            disabledReason={
              isLocked
                ? "Desbloquea marcando el NIF M como recibido"
                : !caseRecord.requiresModelo036
                  ? "La clasificación del caso no requiere Modelo 036"
                  : undefined
            }
          />
        </div>
      )}

      {draft && record && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MissingFieldsAlert
              missingFields={draft.missingFields}
              fieldLabels={fieldLabels}
            />
            {!isApproved && !isLocked && (
              <GenerateDraftButton
                caseId={id}
                draftType="036"
                generateAction={generateModelo036DraftAction}
              />
            )}
          </div>

          <DraftWarningsPanel warnings={draft.warnings} />

          {draft.sourceReferences.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Referencias de origen</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {draft.sourceReferences.map((ref, i) => (
                  <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-mono text-xs text-slate-500">{ref.fieldKey}</span>
                    {ref.sourceFileName && (
                      <span className="ml-2 text-slate-700">— {ref.sourceFileName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {grouped.map((group) => (
            <section key={group.section}>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">{group.label}</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {group.entries.map(([key, field]) => (
                  <DraftFieldEditor
                    key={key}
                    fieldKey={key}
                    field={field}
                    caseId={id}
                    draftId={record.id}
                    isApproved={isApproved}
                    updateAction={updateModelo036FieldAction}
                  />
                ))}
              </div>
            </section>
          ))}

          <DraftApprovalPanel
            caseId={id}
            draftId={record.id}
            draftType="036"
            isApproved={isApproved}
            approvedBy={record.approvedBy}
            approvedAt={record.approvedAt}
            missingFieldsCount={draft.missingFields.length}
            approveAction={approveModelo036DraftAction}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Paquete de revisión</h3>
            <p className="text-sm text-slate-600 mb-4">
              Genera un paquete interno imprimible con datos de empresa, marcas IVA/ROI,
              checklist, documentos y líneas de firma.
            </p>
            <Link
              href={`/cases/${id}/review-pack/modelo-036`}
              className="inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Abrir paquete de revisión Modelo 036 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
