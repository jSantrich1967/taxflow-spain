import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const DEV_USER: SessionUser = {
  id: "dev-user",
  email: "dev@taxflow.local",
  name: "Dev Analyst",
  role: "ANALYST",
};

export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isAuthDisabled()) {
    return DEV_USER;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "Analista",
    role: session.user.role,
  };
}

export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Autenticación obligatoria");
  }
  return user;
}

export async function getActorName(): Promise<string> {
  const user = await getCurrentUser();
  return user?.name ?? "Analista";
}
