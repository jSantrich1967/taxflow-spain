import { Modelo036ReviewPack } from "@/lib/types/reviewPack";
import { FieldTable } from "@/components/review-pack/FieldTable";
import { DraftFieldsTable } from "@/components/review-pack/DraftFieldsTable";
import {
  ChecklistTable,
  DocumentsTable,
  NotesList,
  ApprovalSection,
  SignatureBlock,
  BulletList,
} from "@/components/review-pack/ReviewPackSections";

interface Modelo036ReviewPackViewProps {
  pack: Modelo036ReviewPack;
}

export function Modelo036ReviewPackView({ pack }: Modelo036ReviewPackViewProps) {
  return (
    <article className="review-pack-document bg-white text-slate-900 max-w-4xl mx-auto p-8 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:max-w-none print:p-0">
      <header className="mb-8 border-b-2 border-[var(--navy)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          TaxFlow Spain — Internal Review Pack
        </p>
        <h1 className="text-2xl font-bold text-[var(--navy)] mt-1">
          Modelo 036 — Alta Censo de Empresarios
        </h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-slate-500">Case:</span>{" "}
            <strong>{pack.caseNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">Generated:</span>{" "}
            {new Date(pack.generatedAt).toLocaleString()}
          </p>
          <p>
            <span className="text-slate-500">Status:</span> {pack.caseStatus}
          </p>
        </div>
      </header>

      <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:border print:bg-white">
        <strong>Compliance notice:</strong> Internal review pack only. Not an official
        AEAT form. Human approval required before any submission.
      </div>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Workflow Flags
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span
            className={`rounded px-2 py-1 ${pack.flags.requiresModelo036 ? "bg-teal-100 text-teal-800" : "bg-slate-100"}`}
          >
            Modelo 036 Required: {pack.flags.requiresModelo036 ? "Yes" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.flags.vatReviewRequired ? "bg-amber-100 text-amber-800" : "bg-slate-100"}`}
          >
            VAT Review: {pack.flags.vatReviewRequired ? "Yes" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.flags.roiReviewRequired ? "bg-orange-100 text-orange-800" : "bg-slate-100"}`}
          >
            ROI / VIES: {pack.flags.roiReviewRequired ? "Yes" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.idStatus.modelo036Locked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
          >
            Modelo 036: {pack.idStatus.modelo036Locked ? "LOCKED" : "Unlocked"}
          </span>
        </div>
        {pack.businessActivity && (
          <p className="mt-3 text-sm">
            <span className="text-slate-500">Business activity:</span>{" "}
            {pack.businessActivity}
          </p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          NIF M / NIE / DNI Status
        </h2>
        <table className="text-sm w-full max-w-md">
          <tbody>
            <tr>
              <td className="py-1 text-slate-500">NIF M Received</td>
              <td className="py-1 font-medium">
                {pack.idStatus.nifMReceived ? "Yes" : "No"}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">NIF M Number</td>
              <td className="py-1 font-medium">{pack.idStatus.nifMNumber ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <FieldTable title="Company Information" rows={pack.company} />
      <FieldTable title="Director Information" rows={pack.director} />
      <FieldTable title="Representative" rows={pack.representative} />
      <FieldTable
        title="AI Extracted Fields (with sources)"
        rows={pack.extractedFields}
        showSource
      />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          Modelo 036 Internal Draft Fields
        </h2>
        <DraftFieldsTable fields={pack.draftFields} />
      </section>

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Document Checklist
        </h2>
        <ChecklistTable items={pack.checklist} />
      </section>

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Uploaded Documents
        </h2>
        <DocumentsTable documents={pack.documents} />
      </section>

      <BulletList title="Missing Information" items={pack.missingInformation} variant="warning" />
      <BulletList title="Inconsistencies" items={pack.inconsistencies} variant="error" />
      <BulletList
        title="Warnings"
        items={pack.warnings.filter((w) => !w.startsWith("INTERNAL"))}
        variant="warning"
      />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Analyst Notes
        </h2>
        <NotesList notes={pack.analystNotes} />
      </section>

      <ApprovalSection title="Draft Approval" approval={pack.draftApproval} />
      <SignatureBlock />

      <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 print:mt-12">
        TaxFlow Spain · Case {pack.caseNumber} · Modelo 036 Review Pack ·{" "}
        {new Date(pack.generatedAt).toISOString()}
      </footer>
    </article>
  );
}
