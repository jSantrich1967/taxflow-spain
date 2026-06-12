import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { EmailIngestionForm } from "@/components/intake/EmailIngestionForm";
import { CrmIngestionForm } from "@/components/intake/CrmIngestionForm";
import { RunExtractionButton } from "@/components/review/RunExtractionButton";
import { getCaseById } from "@/lib/services/caseService";
import {
  getEmailIngestionLogs,
} from "@/lib/services/emailIngestionService";
import { getCrmIngestionLogs } from "@/lib/services/crmIngestionService";

interface IntakePageProps {
  params: Promise<{ id: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const [emailLogs, crmLogs] = await Promise.all([
    getEmailIngestionLogs(id),
    getCrmIngestionLogs(id),
  ]);

  return (
    <div>
      <PageHeader
        title={`Entrada IA — ${caseRecord.caseNumber}`}
        description="Añade contenido de email o registros del CRM a un caso existente, sin n8n"
        actions={
          <Link
            href={`/cases/${id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Volver al caso
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CaseStatusBadge status={caseRecord.status} />
        <RunExtractionButton caseId={id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Ingesta de email</h2>
          <p className="text-xs text-slate-500 mb-4">
            Pega contenido de email manualmente. También puedes usar la integración automática de Gmail.
          </p>
          <EmailIngestionForm caseId={id} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Importación CRM</h2>
          <p className="text-xs text-slate-500 mb-4">
            Importa JSON desde HubSpot, Salesforce, Zoho o una exportación manual.
          </p>
          <CrmIngestionForm caseId={id} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">API de webhook (integraciones)</h3>
        <p className="text-sm text-slate-600 mb-2">
          Envía JSON por POST a{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs border">
            /api/webhooks/ingest
          </code>
        </p>
        <pre className="text-xs bg-white border rounded p-3 overflow-x-auto text-slate-700">
{`{
  "source": "hubspot",
  "create_case": true,
  "contact_name": "John Smith",
  "contact_email": "john@acme.com",
  "crm": {
    "name": "hubspot",
    "external_record_id": "12345",
    "data": { "company_name": "Acme Ltd" }
  }
}`}
        </pre>
        <p className="text-xs text-slate-500 mt-2">
          Configura <code>WEBHOOK_SECRET</code> en .env y envía el header{" "}
          <code>x-webhook-secret</code> en producción.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Registro de ingesta de emails</h3>
          {emailLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no se han ingerido emails.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {emailLogs.map((log) => (
                <li key={log.id} className="border-b border-slate-100 pb-2">
                  <p className="font-medium">{log.subject ?? "Sin asunto"}</p>
                  <p className="text-xs text-slate-500">
                    {log.fromEmail} · {log.processed ? "Procesado" : "Pendiente"} ·{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Registro de ingesta CRM</h3>
          {crmLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no se han importado registros CRM.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {crmLogs.map((log) => (
                <li key={log.id} className="border-b border-slate-100 pb-2">
                  <p className="font-medium">{log.crmName}</p>
                  <p className="text-xs text-slate-500">
                    ID: {log.externalRecordId ?? "—"} ·{" "}
                    {log.processed ? "Procesado" : "Pendiente"} ·{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
