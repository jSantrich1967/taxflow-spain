"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      redirect(`/login?error=Invalid+credentials&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    redirect(callbackUrl);
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      redirect(`/login?error=Invalid+credentials&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
