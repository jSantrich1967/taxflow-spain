import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    authorized({ auth, request }) {
      if (process.env.AUTH_DISABLED === "true") {
        return true;
      }

      const { pathname } = request.nextUrl;

      if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/api/cron") ||
        pathname === "/api/integrations/gmail/callback"
      ) {
        return true;
      }

      const isLoginPage = pathname === "/login";
      const isLoggedIn = Boolean(auth?.user);

      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      if (
        (pathname.startsWith("/settings") ||
          pathname.startsWith("/integrations")) &&
        auth?.user?.role !== "ADMIN"
      ) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
