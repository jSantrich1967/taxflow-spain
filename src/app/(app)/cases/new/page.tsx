import { PageHeader } from "@/components/layout/PageHeader";
import { createCaseAction } from "@/app/actions/cases";

export default function NewCasePage() {
  return (
    <div>
      <PageHeader
        title="Nuevo caso"
        description="Crea un caso con entrada manual: pega emails, importa JSON del CRM o sube documentos"
      />

      <form
        action={createCaseAction}
        className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Información de contacto</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nombre del contacto
              </label>
              <input
                name="contactName"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email del contacto
              </label>
              <input
                name="contactEmail"
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="client@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Teléfono del contacto
              </label>
              <input
                name="contactPhone"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nombre de la empresa
              </label>
              <input
                name="companyName"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                País de la empresa
              </label>
              <input
                name="companyCountry"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Reino Unido"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Entrada de email (pegar)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">De</label>
              <input
                name="emailFrom"
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Asunto</label>
              <input
                name="emailSubject"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cuerpo del email</label>
          <textarea
            name="emailText"
            rows={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            placeholder="Pega aquí el contenido completo del email..."
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Importar JSON del CRM</h2>
          <textarea
            name="crmJson"
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            placeholder='{"contact_name": "...", "company": "..."}'
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Notas manuales</h2>
          <textarea
            name="manualNotes"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Contexto adicional para la IA..."
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Documentos</h2>
          <input
            type="file"
            name="documents"
            multiple
            accept=".pdf,.txt,.md,.json,.jpg,.jpeg,.png,.webp"
            className="text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF, TXT, JSON e imágenes: máximo {process.env.MAX_UPLOAD_SIZE_MB ?? 10}MB cada uno
          </p>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Crear caso
          </button>
        </div>
      </form>
    </div>
  );
}
