import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Link from "next/link";
import { Shield, Compass, Bell, ShieldCheck, Database, ArrowRight, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "NTRO Industrial Fire Intelligence System",
  description: "Enterprise geospatial thermal anomaly detection and baseline intelligence platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        {/* Modern Light SaaS Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-50 sticky top-0 shadow-sm select-none">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 font-sans">
                  NTRO FireIntel
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-mono font-semibold">
                  GEO-AI v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                National Industrial Thermal Anomaly & Baseline Engine
              </p>
            </div>
          </Link>

          {/* Clean SaaS Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <span>Overview</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Tactical Map</span>
            </Link>

            <Link
              href="/dashboard/alerts"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Alert Queue</span>
            </Link>

            <Link
              href="/dashboard/audit"
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Ledger</span>
            </Link>
          </nav>

          {/* Right Action & Sensor Status */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>VIIRS NRT: Live</span>
            </div>

            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Launch Console</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Main Application Canvas */}
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
