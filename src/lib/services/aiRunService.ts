import prisma from "@/lib/db";
import { AiInputType, Prisma } from "@/generated/prisma/client";
import { ExtractionResult } from "@/lib/services/openaiExtractionService";
import { AiExtractionOutput } from "@/lib/schemas/aiExtractionSchema";

export interface CreateAiRunInput {
  caseId: string;
  inputType: AiInputType;
  inputSummary?: string;
  result: ExtractionResult;
  data?: AiExtractionOutput;
}

/**
 * Log every OpenAI extraction run for audit and review.
 */
export async function createAiRun(input: CreateAiRunInput) {
  const { caseId, inputType, inputSummary, result, data } = input;

  return prisma.aiRun.create({
    data: {
      caseId,
      inputType,
      inputSummary: inputSummary ?? null,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
      structuredOutput: data
        ? (data as unknown as Prisma.InputJsonValue)
        : undefined,
      confidenceScore: data?.confidence_score ?? null,
      warnings: data?.warnings ?? [],
      missingInformation: data?.missing_information ?? [],
      inconsistencies: data?.inconsistencies ?? [],
      processingTimeMs: result.processingTimeMs,
      reviewedByHuman: false,
    },
  });
}

export async function getAiRunsForCase(caseId: string) {
  return prisma.aiRun.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAiRunReviewed(
  aiRunId: string,
  summary?: string,
) {
  return prisma.aiRun.update({
    where: { id: aiRunId },
    data: {
      reviewedByHuman: true,
      humanCorrectionsSummary: summary ?? null,
    },
  });
}
