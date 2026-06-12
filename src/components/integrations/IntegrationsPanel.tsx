"use client";

import { useState } from "react";
import {
  disconnectGmailAction,
  runIntegrationSyncNowAction,
  saveHubSpotTokenAction,
} from "@/app/actions/integrations";

interface IntegrationsPanelProps {
  status: {
    gmail: {
      connected: boolean;
      email: string | null;
      lastSyncAt: string | null;
      lastSyncError: string | null;
    };
    hubspot: {
      connected: boolean;
      lastSyncAt: string | null;
      lastSyncError: string | null;
    };
    autoExtractEnabled: boolean;
    cronConfigured: boolean;
  };
  flash?: {
    connected?: string | null;
    error?: string | null;
  };
}

export function IntegrationsPanel({ status, flash }: IntegrationsPanelProps) {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSyncNow() {
    setLoading(true);
    setSyncMessage(null);
    try {
      const result = await runIntegrationSyncNowAction();
      if (result.success && result.summary) {
        const g = result.summary.gmail;
        const h = result.summary.hubspot;
        setSyncMessage(
          `Gmail: ${g.processed} procesados (${g.createdCases} casos nuevos). HubSpot: ${h.processed} procesados (${h.createdCases} casos nuevos).`,
        );
      }
    } catch {
      setSyncMessage("La sincronización falló. Revisa la configuración e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {flash?.connected === "gmail" && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Gmail conectado correctamente.
        </p>
      )}
      {flash?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {flash.error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Gmail (automático)</h2>
        <p className="mt-1 text-sm text-slate-600">
          El sistema lee correos no leídos, crea o actualiza casos y ejecuta la
          extracción con IA automáticamente, sin copiar y pegar.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            Estado:{" "}
            <span className={status.gmail.connected ? "text-green-700" : "text-amber-700"}>
              {status.gmail.connected
                ? `Conectado${status.gmail.email ? ` como ${status.gmail.email}` : ""}`
                : "No conectado"}
            </span>
          </p>
          {status.gmail.lastSyncAt && (
            <p className="text-slate-500">
              Última sincronización: {new Date(status.gmail.lastSyncAt).toLocaleString()}
            </p>
          )}
          {status.gmail.lastSyncError && (
            <p className="text-red-600">Último error: {status.gmail.lastSyncError}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/integrations/gmail/authorize"
            className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {status.gmail.connected ? "Reconectar Gmail" : "Conectar Gmail"}
          </a>
          {status.gmail.connected && (
            <form action={disconnectGmailAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Desconectar
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">CRM — HubSpot (automático)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sincroniza contactos de HubSpot en casos y ejecuta la extracción con IA.
          Usa tu token de aplicación privada de HubSpot.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            Estado:{" "}
            <span className={status.hubspot.connected ? "text-green-700" : "text-amber-700"}>
              {status.hubspot.connected ? "Token configurado" : "No configurado"}
            </span>
          </p>
          {status.hubspot.lastSyncAt && (
            <p className="text-slate-500">
              Última sincronización: {new Date(status.hubspot.lastSyncAt).toLocaleString()}
            </p>
          )}
          {status.hubspot.lastSyncError && (
            <p className="text-red-600">Último error: {status.hubspot.lastSyncError}</p>
          )}
        </div>

        <form action={saveHubSpotTokenAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="hubspotToken" className="block text-sm font-medium text-slate-700">
              Token de aplicación privada de HubSpot
            </label>
            <input
              id="hubspotToken"
              name="hubspotToken"
              type="password"
              required
              placeholder="pat-..."
              className="mt-1 w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Guardar token de HubSpot
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sincronización automática</h2>
        <p className="mt-1 text-sm text-slate-600">
          Extracción automática con IA: {status.autoExtractEnabled ? "activada" : "desactivada"}.
          Cron: {status.cronConfigured ? "configurado" : "no configurado (usa Sincronizar ahora)"}.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={handleSyncNow}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Sincronizando..." : "Sincronizar ahora (Gmail + HubSpot)"}
        </button>
        {syncMessage && (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {syncMessage}
          </p>
        )}
      </section>
    </div>
  );
}
