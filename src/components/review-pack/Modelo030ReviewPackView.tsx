import { Modelo030ReviewPack } from "@/lib/types/reviewPack";
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

interface Modelo030ReviewPackViewProps {
  pack: Modelo030ReviewPack;
}

export function Modelo030ReviewPackView({ pack }: Modelo030ReviewPackViewProps) {
  return (
    <article className="review-pack-document bg-white text-slate-900 max-w-4xl mx-auto p-8 shadow-sm border border-slate-200 print:shadow-none print:border-0 print:max-w-none print:p-0">
      <header className="mb-8 border-b-2 border-[var(--navy)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          TaxFlow Spain — Paquete interno de revisión
        </p>
        <h1 className="text-2xl font-bold text-[var(--navy)] mt-1">
          Modelo 030 — Solicitud de NIF (NIF M)
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
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-2">
          Motivo del Modelo 030
        </h2>
        <p className="text-sm">{pack.reasonForModelo030}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Estado DNI / NIE / NIF
        </h2>
        <table className="text-sm w-full max-w-md">
          <tbody>
            <tr>
              <td className="py-1 text-slate-500">DNI español</td>
              <td className="py-1 font-medium">
                {pack.idStatus.hasSpanishDni ? "Sí" : "No"}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">NIE español</td>
              <td className="py-1 font-medium">
                {pack.idStatus.hasSpanishNie ? "Sí" : "No"}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">NIF español</td>
              <td className="py-1 font-medium">
                {pack.idStatus.hasSpanishNif ? "Sí" : "No"}
              </td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">NIF M recibido</td>
              <td className="py-1 font-medium">
                {pack.idStatus.nifMReceived ? "Sí" : "No"}
                {pack.idStatus.nifMNumber && ` (${pack.idStatus.nifMNumber})`}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <FieldTable title="Información de contacto" rows={pack.contact} />
      <FieldTable title="Información del director" rows={pack.director} />
      <FieldTable title="Datos del pasaporte" rows={pack.passport} />
      <FieldTable
        title="Campos extraídos por IA (con fuentes)"
        rows={pack.extractedFields}
        showSource
      />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          Campos del borrador interno Modelo 030
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
      <BulletList title="Advertencias" items={pack.warnings.filter((w) => !w.startsWith("INTERNAL"))} variant="warning" />

      <section className="review-pack-section mb-6 break-inside-avoid">
        <h2 className="text-base font-bold border-b border-slate-300 pb-1 mb-3">
          Notas del analista
        </h2>
        <NotesList notes={pack.analystNotes} />
      </section>

      <ApprovalSection title="Aprobación del borrador" approval={pack.draftApproval} />
      <SignatureBlock />

      <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 print:mt-12">
        TaxFlow Spain · Caso {pack.caseNumber} · Paquete de revisión Modelo 030 ·{" "}
        {new Date(pack.generatedAt).toISOString()}
      </footer>
    </article>
  );
}
