import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/review-pack/PrintButton";
import { Modelo030ReviewPackView } from "@/components/review-pack/Modelo030ReviewPackView";
import { buildModelo030ReviewPack } from "@/lib/services/reviewPackService";
import { getCaseById } from "@/lib/services/caseService";

interface ReviewPackPageProps {
  params: Promise<{ id: string }>;
}

export default async function Modelo030ReviewPackPage({ params }: ReviewPackPageProps) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const pack = await buildModelo030ReviewPack(id);
  if (!pack) notFound();

  return (
    <div className="print:bg-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print max-w-4xl mx-auto">
        <div>
          <Link
            href={`/cases/${id}/modelo-030-draft`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Volver al borrador Modelo 030
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            Paquete de revisión — {caseRecord.caseNumber}
          </h1>
        </div>
        <PrintButton />
      </div>

      <Modelo030ReviewPackView pack={pack} />
    </div>
  );
}
