import OpenAI from "openai";
import {
  aiExtractionOutputSchema,
  AiExtractionOutput,
  aiExtractionJsonSchema,
} from "@/lib/schemas/aiExtractionSchema";
import { AiInputType } from "@/lib/enums";

const PROMPT_VERSION = "1.0.0";
const DEFAULT_MODEL = "gpt-4o";

export interface ExtractionRequest {
  caseId: string;
  inputType: AiInputType | string;
  emailText?: string;
  crmData?: Record<string, unknown>;
  documentTexts?: Array<{ fileName: string; content: string }>;
  manualNotes?: string;
}

export interface ExtractionResult {
  success: boolean;
  data?: AiExtractionOutput;
  error?: string;
  modelUsed: string;
  promptVersion: string;
  processingTimeMs: number;
}

const SYSTEM_PROMPT = `You are TaxFlow Spain AI Intake Assistant — an internal data extraction tool for Spanish tax analysts.

YOUR ROLE:
- Extract structured data from emails, CRM records, and documents.
- Identify client, director, company, representative, and document information.
- Flag missing information and inconsistencies.
- Provide confidence scores and source references.
- Write a brief analyst_summary in the same language as the source material.

STRICT RULES — YOU MUST FOLLOW:
- NEVER make final legal or tax decisions.
- NEVER determine whether a form should be officially submitted.
- NEVER claim data is legally final or AEAT-ready.
- ONLY extract and structure information that appears in the provided sources.
- Use empty strings for unknown text fields and false for unknown booleans.
- List all missing_information items you detect.
- List inconsistencies when sources contradict each other.
- Include warnings for ambiguous or low-confidence extractions.
- Set confidence_score between 0 and 1 for the overall extraction.

Return ONLY valid JSON matching the required schema.`;

function buildUserPrompt(request: ExtractionRequest): string {
  const sections: string[] = [];

  if (request.emailText) {
    sections.push(`## Email Content\n${request.emailText}`);
  }

  if (request.crmData) {
    sections.push(
      `## CRM Data\n${JSON.stringify(request.crmData, null, 2)}`,
    );
  }

  if (request.documentTexts?.length) {
    for (const doc of request.documentTexts) {
      sections.push(`## Document: ${doc.fileName}\n${doc.content}`);
    }
  }

  if (request.manualNotes) {
    sections.push(`## Manual Notes\n${request.manualNotes}`);
  }

  return sections.join("\n\n") || "No input provided.";
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

/**
 * Call OpenAI to extract structured tax workflow data.
 * Server-side only — never expose API key to the client.
 *
 * Returns validated Zod output or an error. Does not persist to DB
 * (persistence handled by aiRunService in Phase 2).
 */
export async function extractStructuredData(
  request: ExtractionRequest,
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const modelUsed = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  const client = getOpenAIClient();
  if (!client) {
    return {
      success: false,
      error:
        "OPENAI_API_KEY is not configured. Set it in .env for AI extraction.",
      modelUsed,
      promptVersion: PROMPT_VERSION,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: modelUsed,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(request) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: aiExtractionJsonSchema,
      },
      temperature: 0.1,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      return {
        success: false,
        error: "OpenAI returned an empty response.",
        modelUsed,
        promptVersion: PROMPT_VERSION,
        processingTimeMs: Date.now() - startTime,
      };
    }

    const parsed = JSON.parse(rawContent);
    const validated = aiExtractionOutputSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        success: false,
        error: `Schema validation failed: ${validated.error.message}`,
        modelUsed,
        promptVersion: PROMPT_VERSION,
        processingTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: validated.data,
      modelUsed,
      promptVersion: PROMPT_VERSION,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido de extracción";
    return {
      success: false,
      error: message,
      modelUsed,
      promptVersion: PROMPT_VERSION,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Validate pre-parsed extraction output (e.g. from cached AI run).
 */
export function validateExtractionOutput(
  data: unknown,
): AiExtractionOutput | null {
  const result = aiExtractionOutputSchema.safeParse(data);
  return result.success ? result.data : null;
}

export { PROMPT_VERSION, DEFAULT_MODEL, SYSTEM_PROMPT };
