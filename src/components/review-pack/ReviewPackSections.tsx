import {
  ReviewPackChecklistRow,
  ReviewPackDocumentRow,
  ReviewPackNote,
  ReviewPackApproval,
} from "@/lib/types/reviewPack";

export function ChecklistTable({ items }: { items: ReviewPackChecklistRow[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No checklist items.</p>;

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-300 px-3 py-2 text-left">Document</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Category</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Required</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td className="border border-slate-300 px-3 py-2">{item.documentName}</td>
            <td className="border border-slate-300 px-3 py-2">{item.category}</td>
            <td className="border border-slate-300 px-3 py-2">
              {item.required ? "Yes" : "No"}
            </td>
            <td className="border border-slate-300 px-3 py-2">{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DocumentsTable({ documents }: { documents: ReviewPackDocumentRow[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">No documents uploaded.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-300 px-3 py-2 text-left">File</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Type</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Status</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc, i) => (
          <tr key={i}>
            <td className="border border-slate-300 px-3 py-2">{doc.fileName}</td>
            <td className="border border-slate-300 px-3 py-2">{doc.documentType ?? "—"}</td>
            <td className="border border-slate-300 px-3 py-2">{doc.status}</td>
            <td className="border border-slate-300 px-3 py-2 text-xs">
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NotesList({ notes }: { notes: ReviewPackNote[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-slate-500">No analyst notes.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note, i) => (
        <li key={i} className="border border-slate-200 rounded p-3 text-sm">
          <p className="text-slate-800">{note.content}</p>
          <p className="text-xs text-slate-400 mt-1">
            {note.author ?? "Analyst"} · {new Date(note.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ApprovalSection({
  title,
  approval,
}: {
  title: string;
  approval: ReviewPackApproval | null;
}) {
  return (
    <section className="review-pack-section mb-6 break-inside-avoid">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
        {title}
      </h2>
      {approval ? (
        <div className="text-sm space-y-1">
          <p>
            <span className="text-slate-500">Status:</span>{" "}
            <strong>{approval.status}</strong>
          </p>
          <p>
            <span className="text-slate-500">Approved by:</span>{" "}
            {approval.approvedBy ?? "—"}
          </p>
          {approval.approvedAt && (
            <p>
              <span className="text-slate-500">Date:</span>{" "}
              {new Date(approval.approvedAt).toLocaleString()}
            </p>
          )}
          {approval.notes && (
            <p>
              <span className="text-slate-500">Notes:</span> {approval.notes}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">Pending approval</p>
      )}
    </section>
  );
}

export function SignatureBlock() {
  return (
    <section className="review-pack-section mt-10 break-inside-avoid">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-6">
        Signatures
      </h2>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-8">Analyst Review</p>
          <div className="border-b border-slate-400 mb-2 h-8" />
          <p className="text-xs text-slate-500">Name / Signature / Date</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-8">Supervisor Approval</p>
          <div className="border-b border-slate-400 mb-2 h-8" />
          <p className="text-xs text-slate-500">Name / Signature / Date</p>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        By signing, the reviewer confirms data accuracy to the best of their knowledge.
        This does not constitute official AEAT submission.
      </p>
    </section>
  );
}

export function BulletList({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "warning" | "error";
}) {
  if (items.length === 0) return null;

  const colors = {
    default: "text-slate-700",
    warning: "text-amber-800",
    error: "text-red-800",
  };

  return (
    <section className="review-pack-section mb-6 break-inside-avoid">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
        {title}
      </h2>
      <ul className={`list-disc list-inside text-sm space-y-1 ${colors[variant]}`}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
