import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { listCases } from "@/lib/services/caseService";
interface CasesPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams;
  const isReviewFilter = params.filter === "review";

  const cases = isReviewFilter
    ? await listCases({ reviewQueue: true })
    : await listCases();

  return (
    <div>
      <PageHeader
        title={isReviewFilter ? "Cola de revisión" : "Casos"}
        description={
          isReviewFilter
            ? "Casos pendientes de revisión por un analista"
            : "Todos los casos del flujo fiscal"
        }
        actions={
          <Link
            href="/cases/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo caso
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Caso #</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Contacto</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Empresa</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Marcas</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Docs</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Campos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No se encontraron casos.{" "}
                  <Link href="/cases/new" className="text-blue-600 hover:underline">
                    Crear uno
                  </Link>
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/cases/${c.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {c.caseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {c.contactName ?? "—"}
                    {c.contactEmail && (
                      <p className="text-xs text-slate-400">{c.contactEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.companyName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <CaseStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.requiresModelo030 && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                          030
                        </span>
                      )}
                      {c.requiresModelo036 && (
                        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-700">
                          036
                        </span>
                      )}
                      {c.vatReviewRequired && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                          IVA
                        </span>
                      )}
                      {c.modelo036Locked && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                          036 bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c._count.documents}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count.extractedFields}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
