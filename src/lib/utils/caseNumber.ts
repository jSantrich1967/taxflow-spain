import prisma from "@/lib/db";

/**
 * Generate unique case number: TF-2026-00001
 */
export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TF-${year}-`;

  const lastCase = await prisma.case.findFirst({
    where: { caseNumber: { startsWith: prefix } },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });

  let nextSeq = 1;
  if (lastCase?.caseNumber) {
    const seqPart = lastCase.caseNumber.replace(prefix, "");
    const parsed = parseInt(seqPart, 10);
    if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}
