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
      {pending ? "Iniciando sesión..." : "Iniciar sesión"}
    </button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  credentials:
    "Email o contraseña inválidos. Los usuarios de demo deben existir en la base de datos de producción.",
  config:
    "Servidor mal configurado: falta AUTH_SECRET en las variables de entorno de Vercel.",
  server:
    "El inicio de sesión falló por un error del servidor. Abre /api/health para diagnosticar.",
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
          Correo electrónico
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
          Contraseña
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
          {ERROR_MESSAGES[errorCode] ?? "No se pudo iniciar sesión. Inténtalo de nuevo."}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
