export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  let color = "bg-red-100 text-red-700";
  if (pct >= 85) color = "bg-green-100 text-green-700";
  else if (pct >= 70) color = "bg-yellow-100 text-yellow-800";

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {pct}% confidence
    </span>
  );
}
