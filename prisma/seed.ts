import { hashPassword } from "@/lib/auth/password";
import prisma from "@/lib/db";

async function main() {
  const users = [
    {
      fullName: "Admin User",
      email: "admin@taxflow.local",
      password: "Admin123!",
      role: "ADMIN" as const,
    },
    {
      fullName: "Supervisor User",
      email: "supervisor@taxflow.local",
      password: "Supervisor123!",
      role: "SUPERVISOR" as const,
    },
    {
      fullName: "Analyst User",
      email: "analyst@taxflow.local",
      password: "Analyst123!",
      role: "ANALYST" as const,
    },
  ];

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.profile.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        passwordHash,
        role: user.role,
        isActive: true,
      },
      create: {
        fullName: user.fullName,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
      },
    });
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
