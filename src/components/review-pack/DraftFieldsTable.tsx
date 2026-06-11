import { ReviewPackDraftField } from "@/lib/types/reviewPack";

interface DraftFieldsTableProps {
  fields: ReviewPackDraftField[];
}

export function DraftFieldsTable({ fields }: DraftFieldsTableProps) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No draft generated yet. Generate a Modelo draft before printing the review pack.
      </p>
    );
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-300 px-3 py-2 text-left font-semibold">
            Draft Field
          </th>
          <th className="border border-slate-300 px-3 py-2 text-left font-semibold">
            Value
          </th>
          <th className="border border-slate-300 px-3 py-2 text-left font-semibold w-24">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.key} className={field.missing ? "bg-amber-50" : ""}>
            <td className="border border-slate-300 px-3 py-2">
              <span className="font-medium">{field.label}</span>
              <span className="block text-xs text-slate-400 font-mono">{field.key}</span>
            </td>
            <td className="border border-slate-300 px-3 py-2">{field.value}</td>
            <td className="border border-slate-300 px-3 py-2 text-xs">
              {field.missing ? (
                <span className="text-amber-700 font-medium">Missing</span>
              ) : (
                <span className="text-green-700">OK</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
