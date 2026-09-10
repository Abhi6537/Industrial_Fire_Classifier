"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Home",     href: "#home", active: true },
  { label: "Solution", href: "#solution" },
  { label: "Impact",   href: "#impact" },
  { label: "About",    href: "#about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-tw-navy/95 backdrop-blur-md border-b border-tw-border shadow-xl py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tw-orange/20 to-red-600/20 border border-tw-orange/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-tw-orange/10">
            <Flame className="w-5 h-5 text-tw-orange fill-tw-orange/20" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-tw-text font-bold text-base tracking-tight">
              ThermoWatch
            </span>
            <span className="text-tw-muted text-[11px] font-medium tracking-tight mt-0.5">
              From Space to a Safer Tomorrow
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                link.active
                  ? "text-tw-text"
                  : "text-tw-muted hover:text-tw-text"
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-tw-orange rounded-full" />
              )}
            </a>
          ))}
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#f95738] to-[#ff3b30] hover:from-[#ff6b4a] hover:to-[#f95738] text-white text-xs font-bold rounded-lg shadow-lg shadow-tw-orange/25 transition-all hover:shadow-tw-orange/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Open Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-tw-muted hover:text-tw-text focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-tw-surface/98 backdrop-blur-xl border-b border-tw-border px-6 pt-4 pb-6 mt-2 flex flex-col gap-2 animate-fade-up">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`py-2 text-sm font-semibold border-b border-tw-border/40 last:border-0 ${
                link.active ? "text-tw-orange font-bold" : "text-tw-muted hover:text-tw-text"
              }`}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="mt-3 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#f95738] to-[#ff3b30] text-white text-xs font-bold rounded-lg shadow-lg"
            onClick={() => setMobileOpen(false)}
          >
            Open Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
