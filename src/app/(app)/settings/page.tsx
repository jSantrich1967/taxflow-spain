import Link from "next/link";
import { getGdprDashboardDataAction } from "@/app/actions/gdpr";
import { GdprCaseTools } from "@/components/settings/GdprCaseTools";

export default async function SettingsPage() {
  const data = await getGdprDashboardDataAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración y cumplimiento</h1>
        <p className="mt-1 text-sm text-slate-600">
          Solo administradores: usuarios, controles GDPR y política de retención
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Política de retención de datos</h2>
        <p className="mt-2 text-sm text-slate-600">{data.policy.description}</p>
        <p className="mt-2 text-sm">
          Ventana de retención:{" "}
          <span className="font-medium">{data.policy.retentionDays} días</span>
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Usuarios</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{user.fullName}</td>
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">{user.role}</td>
                  <td className="py-2 pr-4">
                    {user.isActive ? "Activo" : "Inactivo"}
                  </td>
                  <td className="py-2">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Cola de revisión de retención
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Casos más antiguos que la ventana de retención en estados finales
        </p>
        {data.retentionCandidates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay casos pendientes de revisión.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.retentionCandidates.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/cases/${item.id}`}
                  className="font-medium text-[var(--navy)] hover:underline"
                >
                  {item.caseNumber}
                </Link>
                <span className="text-slate-500">
                  {item.status} · actualizado{" "}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <GdprCaseTools />
    </div>
  );
}
