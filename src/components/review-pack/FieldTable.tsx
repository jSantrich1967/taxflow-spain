import { ReviewPackFieldRow } from "@/lib/types/reviewPack";

interface FieldTableProps {
  title: string;
  rows: ReviewPackFieldRow[];
  showSource?: boolean;
}

export function FieldTable({ title, rows, showSource = false }: FieldTableProps) {
  if (rows.length === 0) return null;

  return (
    <section className="review-pack-section mb-6 break-inside-avoid">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
        {title}
      </h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold w-1/3">
              Campo
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">
              Valor
            </th>
            {showSource && (
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold w-1/4">
                Fuente / Confianza
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border border-slate-300 px-3 py-2 text-slate-700">
                {row.label}
              </td>
              <td className="border border-slate-300 px-3 py-2 font-medium">
                {row.value}
              </td>
              {showSource && (
                <td className="border border-slate-300 px-3 py-2 text-xs text-slate-500">
                  {row.source && <span>{row.source}</span>}
                  {row.confidence != null && (
                    <span className="block">
                      {Math.round(row.confidence * 100)}% confianza
                    </span>
                  )}
                  {row.approved != null && (
                    <span className="block">
                      {row.approved ? "✓ Aprobado" : "Pendiente de revisión"}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
