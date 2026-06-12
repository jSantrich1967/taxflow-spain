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
        title={`Revisión — ${caseRecord.caseNumber}`}
        description="Revisa los campos extraídos por IA, corrige valores y aprueba antes de continuar"
        actions={
          <Link
            href={`/cases/${id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Volver al caso
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CaseStatusBadge status={caseRecord.status} />
        <span className="text-sm text-slate-600">
          {approvedCount}/{totalFields} campos aprobados
        </span>
        {latestAiRun?.confidenceScore != null && (
          <ConfidenceBadge score={latestAiRun.confidenceScore} />
        )}
        <RunExtractionButton caseId={id} />
      </div>

      {structuredOutput?.case_summary?.analyst_summary && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900 mb-2">Resumen del analista IA</h2>
          <p className="text-sm text-blue-800">{structuredOutput.case_summary.analyst_summary}</p>
          {structuredOutput.case_summary.detected_workflow && (
            <p className="mt-2 text-xs text-blue-600">
              Flujo detectado: {structuredOutput.case_summary.detected_workflow}
            </p>
          )}
        </div>
      )}

      {(structuredOutput?.missing_information?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">Información faltante</h2>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            {structuredOutput!.missing_information!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {(structuredOutput?.inconsistencies?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-2">Inconsistencias</h2>
          <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
            {structuredOutput!.inconsistencies!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {caseRecord.extractedFields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600 mb-4">Todavía no hay campos extraídos.</p>
          <p className="text-sm text-slate-500 mb-6">
            Sube documentos o pega contenido de email, luego ejecuta la extracción con IA.
          </p>
          <RunExtractionButton caseId={id} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(fieldsByEntity).map(([entity, fields]) => (
            <section key={entity}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                Campos de {entity.toLowerCase().replace(/_/g, " ")}
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Checklist de documentos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-4">Documento</th>
                  <th className="pb-2 pr-4">Categoría</th>
                  <th className="pb-2 pr-4">Requerido</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {caseRecord.checklistItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 font-medium">{item.documentName}</td>
                    <td className="py-2 pr-4 text-slate-600">{item.category}</td>
                    <td className="py-2 pr-4">{item.required ? "Sí" : "No"}</td>
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
            Abrir borrador Modelo 030 →
          </Link>
        )}
        {caseRecord.requiresModelo036 && !caseRecord.modelo036Locked && (
          <Link
            href={`/cases/${id}/modelo-036-draft`}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Abrir borrador Modelo 036 →
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Cada campo rellenado por IA es editable. Aprueba cada campo después de verificarlo,
        luego genera y aprueba los borradores internos de Modelo 030/036 antes de cualquier preparación AEAT.
      </div>
    </div>
  );
}
