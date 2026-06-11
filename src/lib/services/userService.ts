import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole } from "@/generated/prisma/client";

export async function listProfiles() {
  return prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createProfile(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await hashPassword(input.password);

  return prisma.profile.create({
    data: {
      fullName: input.fullName,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: input.role,
    },
  });
}
