"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Building2,
  BarChart3,
  History,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",       href: "/dashboard",      icon: LayoutDashboard },
  { key: "alerts",     label: "Alerts",          href: "/alerts",         icon: Bell },
  { key: "sites",      label: "Sites",           href: "/site/fac_001",   icon: Building2 },
  { key: "analytics",  label: "Analytics",       href: "/analytics",      icon: BarChart3 },
  { key: "historical", label: "Historical Data", href: "/dashboard/audit", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto">
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#1c1f1b]/95 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/90 transition-all duration-300 hover:border-white/30">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isActive = (() => {
            if (item.key === "dashboard") return pathname === "/dashboard";
            if (item.key === "alerts") return pathname === "/alerts" || pathname === "/dashboard/alerts";
            if (item.key === "sites") return pathname.startsWith("/site");
            if (item.key === "analytics") return pathname === "/analytics";
            if (item.key === "historical") return pathname === "/dashboard/audit";
            return false;
          })();

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 select-none ${
                isActive
                  ? "bg-white/15 border border-white/25 text-white font-bold shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  : "text-tw-muted hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-tw-muted"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
