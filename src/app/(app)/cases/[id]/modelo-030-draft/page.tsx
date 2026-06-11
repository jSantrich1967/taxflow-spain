import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { GenerateDraftButton } from "@/components/drafts/GenerateDraftButton";
import { DraftFieldEditor } from "@/components/drafts/DraftFieldEditor";
import { DraftApprovalPanel } from "@/components/drafts/DraftApprovalPanel";
import { MissingFieldsAlert } from "@/components/drafts/MissingFieldsAlert";
import { DraftWarningsPanel } from "@/components/drafts/DraftWarningsPanel";
import { getCaseById } from "@/lib/services/caseService";
import { getLatestModelo030Draft } from "@/lib/services/draftService";
import { groupDraftFields, buildFieldLabelMap } from "@/lib/utils/draftGroups";
import {
  generateModelo030DraftAction,
  updateModelo030FieldAction,
  approveModelo030DraftAction,
} from "@/app/actions/drafts";
import { DraftStatus } from "@/generated/prisma/client";

interface Modelo030DraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function Modelo030DraftPage({ params }: Modelo030DraftPageProps) {
  const { id } = await params;
  const [caseRecord, draftData] = await Promise.all([
    getCaseById(id),
    getLatestModelo030Draft(id),
  ]);

  if (!caseRecord) notFound();

  const draft = draftData?.draft;
  const record = draftData?.record;
  const isApproved = record?.status === DraftStatus.APPROVED;
  const grouped = draft ? groupDraftFields(draft.fields) : [];
  const fieldLabels = draft ? buildFieldLabelMap(draft.fields) : {};

  return (
    <div>
      <PageHeader
        title={`Modelo 030 Draft — ${caseRecord.caseNumber}`}
        description="Internal draft for foreign director NIF (NIF M) — not an official AEAT submission"
        actions={
          <div className="flex gap-2">
            <Link
              href={`/cases/${id}/review`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              AI Review
            </Link>
            <Link
              href={`/cases/${id}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Case
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CaseStatusBadge status={caseRecord.status} />
        {record && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Draft v{record.generatedAt.toLocaleString()}
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
            {record.status.replace(/_/g, " ")}
          </span>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Internal draft only.</strong> This document is prepared for analyst review.
        It is not legally final and must not be submitted to AEAT without explicit human approval.
      </div>

      {!draft && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600 mb-2">No Modelo 030 draft generated yet.</p>
          <p className="text-sm text-slate-500 mb-6">
            Run AI extraction and review fields first, then generate the draft.
          </p>
          <GenerateDraftButton
            caseId={id}
            draftType="030"
            generateAction={generateModelo030DraftAction}
            disabled={!caseRecord.requiresModelo030}
            disabledReason={
              !caseRecord.requiresModelo030
                ? "Case classification does not require Modelo 030"
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
            {!isApproved && (
              <GenerateDraftButton
                caseId={id}
                draftType="030"
                generateAction={generateModelo030DraftAction}
              />
            )}
          </div>

          <DraftWarningsPanel warnings={draft.warnings} />

          {draft.sourceReferences.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Source References</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {draft.sourceReferences.map((ref, i) => (
                  <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-mono text-xs text-slate-500">{ref.fieldKey}</span>
                    {ref.sourceFileName && (
                      <span className="ml-2 text-slate-700">— {ref.sourceFileName}</span>
                    )}
                    {ref.sourceExcerpt && (
                      <p className="mt-0.5 text-xs italic text-slate-400">
                        {ref.sourceExcerpt.slice(0, 120)}
                      </p>
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
                    updateAction={updateModelo030FieldAction}
                  />
                ))}
              </div>
            </section>
          ))}

          <DraftApprovalPanel
            caseId={id}
            draftId={record.id}
            draftType="030"
            isApproved={isApproved}
            approvedBy={record.approvedBy}
            approvedAt={record.approvedAt}
            missingFieldsCount={draft.missingFields.length}
            approveAction={approveModelo030DraftAction}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Review Pack</h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate a printable internal review pack with all case data, checklist,
              documents, and signature lines for analyst/supervisor sign-off.
            </p>
            <Link
              href={`/cases/${id}/review-pack/modelo-030`}
              className="inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Open Modelo 030 Review Pack →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
