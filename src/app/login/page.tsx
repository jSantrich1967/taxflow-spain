import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
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
  const errorCode = params.error?.toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--navy)]">TaxFlow Spain</h1>
          <p className="mt-2 text-sm text-slate-600">
            Inicia sesión para acceder a la plataforma de flujos fiscales
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} errorCode={errorCode} />

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p className="font-medium text-slate-700">Credenciales de demostración</p>
          <p>admin@taxflow.local / Admin123!</p>
          <p className="text-slate-500">
            Requiere <code className="rounded bg-slate-100 px-1">npm run db:seed</code> en
            la base de datos de producción
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href="/api/health" className="underline" target="_blank">
            Estado del sistema
          </Link>
        </p>
      </div>
    </div>
  );
}
