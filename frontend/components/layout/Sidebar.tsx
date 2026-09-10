"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Bell,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Alerts",    href: "/alerts",    icon: Bell },
  { label: "Sites",     href: "/site/fac_001", icon: Building2 },
  { label: "Analytics", href: "/dashboard", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-tw-surface border-r border-tw-border flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand */}
      <div className="p-5 border-b border-tw-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-tw-orange/15 border border-tw-orange/30 flex items-center justify-center flex-shrink-0">
          <Flame className="w-4.5 h-4.5 text-tw-orange fill-tw-orange/20" />
        </div>
        <div className="flex flex-col">
          <span className="text-tw-text font-bold text-sm tracking-tight">
            ThermoWatch
          </span>
          <span className="text-tw-muted text-[10px]">
            From Space to a Safer Tomorrow
          </span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="p-3 flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.startsWith("/site") && pathname.startsWith("/site"));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-tw-teal/15 text-tw-teal border border-tw-teal/30"
                  : "text-tw-muted hover:text-tw-text hover:bg-tw-raised border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-tw-border">
        <Link
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-tw-muted hover:text-tw-text hover:bg-tw-raised transition-all"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
