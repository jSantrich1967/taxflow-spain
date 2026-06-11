"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  if (!process.env.AUTH_SECRET) {
    redirect(
      `/login?error=config&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      redirect(
        `/login?error=credentials&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }

    console.error("Login failed:", error);
    redirect(
      `/login?error=server&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
