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
          TaxFlow Spain — Paquete interno de revisión
        </p>
        <h1 className="text-2xl font-bold text-[var(--navy)] mt-1">
          Modelo 036 — Alta Censo de Empresarios
        </h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-slate-500">Caso:</span>{" "}
            <strong>{pack.caseNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">Generado:</span>{" "}
            {new Date(pack.generatedAt).toLocaleString()}
          </p>
          <p>
            <span className="text-slate-500">Estado:</span> {pack.caseStatus}
          </p>
        </div>
      </header>

      <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:border print:bg-white">
        <strong>Aviso de cumplimiento:</strong> solo paquete interno de revisión. No es un
        formulario oficial de AEAT. Se requiere aprobación humana antes de cualquier envío.
      </div>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Marcas del flujo
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span
            className={`rounded px-2 py-1 ${pack.flags.requiresModelo036 ? "bg-teal-100 text-teal-800" : "bg-slate-100"}`}
          >
            Modelo 036 requerido: {pack.flags.requiresModelo036 ? "Sí" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.flags.vatReviewRequired ? "bg-amber-100 text-amber-800" : "bg-slate-100"}`}
          >
            Revisión de IVA: {pack.flags.vatReviewRequired ? "Sí" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.flags.roiReviewRequired ? "bg-orange-100 text-orange-800" : "bg-slate-100"}`}
          >
            ROI / VIES: {pack.flags.roiReviewRequired ? "Sí" : "No"}
          </span>
          <span
            className={`rounded px-2 py-1 ${pack.idStatus.modelo036Locked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
          >
            Modelo 036: {pack.idStatus.modelo036Locked ? "BLOQUEADO" : "Desbloqueado"}
          </span>
        </div>
        {pack.businessActivity && (
          <p className="mt-3 text-sm">
            <span className="text-slate-500">Actividad empresarial:</span>{" "}
            {pack.businessActivity}
          </p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Estado NIF M / NIE / DNI
        </h2>
        <table className="text-sm w-full max-w-md">
          <tbody>
            <tr>
              <td className="py-1 text-slate-500">NIF M recibido</td>
              <td className="py-1 font-medium">
                {pack.idStatus.nifMReceived ? "Sí" : "No"}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">Número NIF M</td>
              <td className="py-1 font-medium">{pack.idStatus.nifMNumber ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <FieldTable title="Información de la empresa" rows={pack.company} />
      <FieldTable title="Información del director" rows={pack.director} />
      <FieldTable title="Representante" rows={pack.representative} />
      <FieldTable
        title="Campos extraídos por IA (con fuentes)"
        rows={pack.extractedFields}
        showSource
      />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          Campos del borrador interno Modelo 036
        </h2>
        <DraftFieldsTable fields={pack.draftFields} />
      </section>

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Checklist de documentos
        </h2>
        <ChecklistTable items={pack.checklist} />
      </section>

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Documentos subidos
        </h2>
        <DocumentsTable documents={pack.documents} />
      </section>

      <BulletList title="Información faltante" items={pack.missingInformation} variant="warning" />
      <BulletList title="Inconsistencias" items={pack.inconsistencies} variant="error" />
      <BulletList
        title="Advertencias"
        items={pack.warnings.filter((w) => !w.startsWith("INTERNAL"))}
        variant="warning"
      />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Notas del analista
        </h2>
        <NotesList notes={pack.analystNotes} />
      </section>

      <ApprovalSection title="Aprobación del borrador" approval={pack.draftApproval} />
      <SignatureBlock />

      <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 print:mt-12">
        TaxFlow Spain · Caso {pack.caseNumber} · Paquete de revisión Modelo 036 ·{" "}
        {new Date(pack.generatedAt).toISOString()}
      </footer>
    </article>
  );
}
