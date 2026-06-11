import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/review-pack/PrintButton";
import { Modelo036ReviewPackView } from "@/components/review-pack/Modelo036ReviewPackView";
import { buildModelo036ReviewPack } from "@/lib/services/reviewPackService";
import { getCaseById } from "@/lib/services/caseService";

interface ReviewPackPageProps {
  params: Promise<{ id: string }>;
}

export default async function Modelo036ReviewPackPage({ params }: ReviewPackPageProps) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const pack = await buildModelo036ReviewPack(id);
  if (!pack) notFound();

  return (
    <div className="print:bg-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print max-w-4xl mx-auto">
        <div>
          <Link
            href={`/cases/${id}/modelo-036-draft`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Modelo 036 Draft
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            Review Pack — {caseRecord.caseNumber}
          </h1>
        </div>
        <PrintButton />
      </div>

      <Modelo036ReviewPackView pack={pack} />
    </div>
  );
}
