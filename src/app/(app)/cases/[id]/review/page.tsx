import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { FieldReviewCard } from "@/components/review/FieldReviewCard";
import { RunExtractionButton } from "@/components/review/RunExtractionButton";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { getCaseById } from "@/lib/services/caseService";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);

  if (!caseRecord) notFound();

  const latestAiRun = caseRecord.aiRuns[0];
  const structuredOutput = latestAiRun?.structuredOutput as {
    missing_information?: string[];
    inconsistencies?: string[];
    warnings?: string[];
    case_summary?: { analyst_summary?: string; detected_workflow?: string };
  } | null;

  const fieldsByEntity = caseRecord.extractedFields.reduce<
    Record<string, typeof caseRecord.extractedFields>
  >((acc, field) => {
    const key = field.entityType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(field);
    return acc;
  }, {});

  const approvedCount = caseRecord.extractedFields.filter((f) => f.analystApproved).length;
  const totalFields = caseRecord.extractedFields.length;

  return (
    <div>
      <PageHeader
        title={`Review — ${caseRecord.caseNumber}`}
        description="Review AI-extracted fields, correct values, and approve before proceeding"
        actions={
          <Link
            href={`/cases/${id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Case
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CaseStatusBadge status={caseRecord.status} />
        <span className="text-sm text-slate-600">
          {approvedCount}/{totalFields} fields approved
        </span>
        {latestAiRun?.confidenceScore != null && (
          <ConfidenceBadge score={latestAiRun.confidenceScore} />
        )}
        <RunExtractionButton caseId={id} />
      </div>

      {structuredOutput?.case_summary?.analyst_summary && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900 mb-2">AI Analyst Summary</h2>
          <p className="text-sm text-blue-800">{structuredOutput.case_summary.analyst_summary}</p>
          {structuredOutput.case_summary.detected_workflow && (
            <p className="mt-2 text-xs text-blue-600">
              Detected workflow: {structuredOutput.case_summary.detected_workflow}
            </p>
          )}
        </div>
      )}

      {(structuredOutput?.missing_information?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">Missing Information</h2>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            {structuredOutput!.missing_information!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {(structuredOutput?.inconsistencies?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-2">Inconsistencies</h2>
          <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
            {structuredOutput!.inconsistencies!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {caseRecord.extractedFields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600 mb-4">No extracted fields yet.</p>
          <p className="text-sm text-slate-500 mb-6">
            Upload documents or paste email content, then run AI extraction.
          </p>
          <RunExtractionButton caseId={id} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(fieldsByEntity).map(([entity, fields]) => (
            <section key={entity}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                {entity.toLowerCase().replace(/_/g, " ")} Fields
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {fields.map((field) => (
                  <FieldReviewCard key={field.id} field={field} caseId={id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {caseRecord.checklistItems.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Document Checklist</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-4">Document</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Required</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {caseRecord.checklistItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 font-medium">{item.documentName}</td>
                    <td className="py-2 pr-4 text-slate-600">{item.category}</td>
                    <td className="py-2 pr-4">{item.required ? "Yes" : "No"}</td>
                    <td className="py-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {caseRecord.requiresModelo030 && (
          <Link
            href={`/cases/${id}/modelo-030-draft`}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Open Modelo 030 Draft →
          </Link>
        )}
        {caseRecord.requiresModelo036 && !caseRecord.modelo036Locked && (
          <Link
            href={`/cases/${id}/modelo-036-draft`}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Open Modelo 036 Draft →
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Every AI-filled field is editable. Approve each field after verification, then
        generate and approve Modelo 030/036 internal drafts before any AEAT preparation.
      </div>
    </div>
  );
}
