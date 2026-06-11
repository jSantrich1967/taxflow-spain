import Link from "next/link";
import { getGdprDashboardDataAction } from "@/app/actions/gdpr";
import { GdprCaseTools } from "@/components/settings/GdprCaseTools";

export default async function SettingsPage() {
  const data = await getGdprDashboardDataAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & Compliance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin-only: users, GDPR controls, and retention policy
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Data retention policy</h2>
        <p className="mt-2 text-sm text-slate-600">{data.policy.description}</p>
        <p className="mt-2 text-sm">
          Retention window:{" "}
          <span className="font-medium">{data.policy.retentionDays} days</span>
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{user.fullName}</td>
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">{user.role}</td>
                  <td className="py-2 pr-4">
                    {user.isActive ? "Active" : "Inactive"}
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
          Retention review queue
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Cases older than the retention window in terminal statuses
        </p>
        {data.retentionCandidates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No cases pending review.</p>
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
                  {item.status} · updated{" "}
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
