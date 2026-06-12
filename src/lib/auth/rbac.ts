import type { UserRole } from "@/generated/prisma/client";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth/session";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ANALYST: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
};

export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export async function requireRole(...allowedRoles: UserRole[]) {
  const user = await requireCurrentUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Permisos insuficientes");
  }
  return user;
}

export async function requireSupervisorOrAdmin() {
  return requireRole("SUPERVISOR", "ADMIN");
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function canApproveDrafts(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasMinimumRole(user.role, "SUPERVISOR");
}
