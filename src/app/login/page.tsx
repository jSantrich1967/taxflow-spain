import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { isAuthDisabled } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  if (isAuthDisabled()) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--navy)]">TaxFlow Spain</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access the tax workflow platform
          </p>
        </div>

        <form
          action={async (formData) => {
            "use server";
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
              placeholder="analyst@taxflow.local"
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

          {params.error && (
            <p className="text-sm text-red-600" role="alert">
              Invalid email or password
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo users are created via{" "}
          <code className="rounded bg-slate-100 px-1">npm run db:seed</code>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href="/api/health" className="underline">
            System health
          </Link>
        </p>
      </div>
    </div>
  );
}
