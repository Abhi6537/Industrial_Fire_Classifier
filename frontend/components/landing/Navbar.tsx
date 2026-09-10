"use client";

import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home",     href: "#home" },
  { label: "Workflow", href: "#workflow" },
  { label: "Impact",   href: "#impact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 flex justify-center items-center transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      {/* Floating Centered Glass Capsule */}
      <div className="relative flex items-center justify-center rounded-full bg-tw-navy/80 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/60 p-1.5 transition-all duration-300 hover:border-white/30">
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = activeLink === link.href;
            const isHovered = hoveredLink === link.href;

            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActiveLink(link.href)}
                onMouseEnter={() => setHoveredLink(link.href)}
                onMouseLeave={() => setHoveredLink(null)}
                className={`relative px-5 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 rounded-full flex items-center justify-center ${
                  isActive ? "text-white font-bold" : "text-tw-muted hover:text-white"
                }`}
              >
                {/* Smooth Animated White Glass Highlight */}
                {(isActive || isHovered) && (
                  <span
                    className={`absolute inset-0 rounded-full transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-white/10 border border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.15)]"
                        : "bg-white/5 border border-white/10"
                    }`}
                  />
                )}

                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Mobile Navbar Control */}
        <div className="md:hidden flex items-center justify-between min-w-[200px] px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-tw-muted">
            Menu
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-tw-muted hover:text-tw-text focus:outline-none rounded-lg hover:bg-tw-raised transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="absolute top-16 left-6 right-6 md:hidden bg-tw-surface/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex flex-col gap-1 animate-fade-up">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => {
                setActiveLink(link.href);
                setMobileOpen(false);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-between ${
                activeLink === link.href
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-tw-muted hover:text-tw-text hover:bg-tw-raised/50"
              }`}
            >
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
