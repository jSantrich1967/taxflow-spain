"use client";

import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  credentials:
    "Invalid email or password. Demo users must be seeded in the production database.",
  config:
    "Server misconfigured: AUTH_SECRET is missing in Vercel environment variables.",
  server:
    "Login failed due to a server error. Open /api/health to diagnose.",
};

export function LoginForm({
  callbackUrl,
  errorCode,
}: {
  callbackUrl: string;
  errorCode?: string;
}) {
  return (
    <form
      action={async (formData) => {
        formData.set("callbackUrl", callbackUrl);
        await loginAction(formData);
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--navy)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
          placeholder="admin@taxflow.local"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--navy)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
        />
      </div>

      {errorCode && (
        <p className="text-sm text-red-600" role="alert">
          {ERROR_MESSAGES[errorCode] ?? "Unable to sign in. Please try again."}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
