import prisma from "@/lib/db";
import { AuditAction as AuditActionEnum } from "@/lib/enums";
import { AuditAction, Prisma } from "@/generated/prisma/client";

export interface AuditLogParams {
  caseId: string;
  action: AuditActionEnum | AuditAction | string;
  userId?: string;
  userName?: string;
  previousValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | Prisma.InputJsonValue;
}

/**
 * Persist an audit log entry for compliance traceability.
 * Every important workflow action should call this service.
 */
export async function logAuditEvent(params: AuditLogParams) {
  const { caseId, action, userId, userName, previousValue, newValue, metadata } =
    params;

  return prisma.auditLog.create({
    data: {
      caseId,
      action: action as AuditAction,
      userId: userId ?? null,
      userName: userName ?? "System",
      previousValue: previousValue ?? null,
      newValue: newValue ?? null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

/**
 * Retrieve audit timeline for a case, newest first.
 */
export async function getAuditTimeline(caseId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Log a case status transition with before/after values.
 */
export async function logStatusChange(
  caseId: string,
  previousStatus: string,
  newStatus: string,
  userName?: string,
) {
  return logAuditEvent({
    caseId,
    action: "STATUS_CHANGED",
    userName,
    previousValue: previousStatus,
    newValue: newStatus,
    metadata: { type: "case_status" },
  });
}
