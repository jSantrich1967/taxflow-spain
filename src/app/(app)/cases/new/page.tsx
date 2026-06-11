import { PageHeader } from "@/components/layout/PageHeader";
import { createCaseAction } from "@/app/actions/cases";

export default function NewCasePage() {
  return (
    <div>
      <PageHeader
        title="New Case"
        description="Create a case with manual intake — paste email, import CRM JSON, upload documents"
      />

      <form
        action={createCaseAction}
        className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Contact Name
              </label>
              <input
                name="contactName"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Contact Email
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
                Contact Phone
              </label>
              <input
                name="contactPhone"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Company Name
              </label>
              <input
                name="companyName"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Company Country
              </label>
              <input
                name="companyCountry"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="United Kingdom"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Email Intake (paste)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
              <input
                name="emailFrom"
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <input
                name="emailSubject"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email Body</label>
          <textarea
            name="emailText"
            rows={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            placeholder="Paste the full email content here…"
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">CRM JSON Import</h2>
          <textarea
            name="crmJson"
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            placeholder='{"contact_name": "...", "company": "..."}'
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Manual Notes</h2>
          <textarea
            name="manualNotes"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Additional context for the AI…"
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Documents</h2>
          <input
            type="file"
            name="documents"
            multiple
            accept=".pdf,.txt,.md,.json,.jpg,.jpeg,.png,.webp"
            className="text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF, TXT, JSON, images — max {process.env.MAX_UPLOAD_SIZE_MB ?? 10}MB each
          </p>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Case
          </button>
        </div>
      </form>
    </div>
  );
}
