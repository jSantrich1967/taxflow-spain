import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getDashboardStats } from "@/lib/services/caseService";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total Cases", value: stats.totalCases, href: "/cases" },
    { label: "Pending Review", value: stats.pendingReview, href: "/cases?filter=review" },
    { label: "Modelo 030 Required", value: stats.requiresModelo030, href: "/cases" },
    { label: "Modelo 036 Required", value: stats.requiresModelo036, href: "/cases" },
    { label: "VAT Review", value: stats.vatReview, href: "/cases" },
    { label: "ROI / VIES", value: stats.roiReview, href: "/cases" },
    { label: "Completed", value: stats.completed, href: "/cases" },
    {
      label: "Avg AI Confidence",
      value: `${Math.round(stats.avgConfidence * 100)}%`,
      href: "/cases",
    },
    { label: "Fields Corrected", value: stats.correctedFields, href: "/cases" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="TaxFlow Spain — workflow overview and analyst queue"
        actions={
          <Link
            href="/cases/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Case
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Cases by Status</h2>
        {stats.byStatus.length === 0 ? (
          <p className="text-sm text-slate-500">
            No cases yet.{" "}
            <Link href="/cases/new" className="text-blue-600 hover:underline">
              Create your first case
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {stats.byStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <CaseStatusBadge status={item.status} />
                <span className="text-sm font-semibold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Compliance reminder:</strong> AI prepares drafts only. All official AEAT
        submissions require human review and approval.
      </div>
    </div>
  );
}
