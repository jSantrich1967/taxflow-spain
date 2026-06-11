import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/auth/password";
import prisma from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const profile = await prisma.profile.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!profile?.isActive || !profile.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(password, profile.passwordHash);
        if (!valid) {
          return null;
        }

        await prisma.profile.update({
          where: { id: profile.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: profile.id,
          email: profile.email,
          name: profile.fullName,
          role: profile.role,
        };
      },
    }),
  ],
});
