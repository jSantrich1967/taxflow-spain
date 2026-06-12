"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: "📊" },
  { href: "/cases", label: "Casos", icon: "📁" },
  { href: "/cases/new", label: "Nuevo caso", icon: "➕" },
  { href: "/cases?filter=review", label: "Cola de revisión", icon: "🔍" },
  { href: "/integrations", label: "Integraciones", icon: "🔗" },
  { href: "/settings", label: "Configuración", icon: "⚙️" },
];

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("/cases?")) return pathname === "/cases";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex flex-1 flex-col">
      <div className="border-b border-white/10 px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight">TaxFlow Spain</h1>
        <p className="mt-1 text-xs text-white/60 leading-snug">
          Flujos fiscales españoles asistidos por IA
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-white/40">Fase 6 de producción</p>
        <p className="text-xs text-white/60 mt-1">Revisión humana obligatoria</p>
      </div>
    </aside>
  );
}
