"use client";

import React from "react";
import { Search, Calendar } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-tw-surface/90 backdrop-blur-md border-b border-tw-border px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-tw-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search location, facility or coordinates..."
          className="w-full bg-tw-navy border border-tw-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-tw-text placeholder-tw-muted focus:outline-none focus:border-tw-teal transition-colors"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Date range display */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tw-navy border border-tw-border rounded-lg text-xs text-tw-muted font-mono">
          <Calendar className="w-3.5 h-3.5 text-tw-teal" />
          <span>Oct 1, 2024 - Oct 7, 2024</span>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-tw-teal/20 border border-tw-teal/40 flex items-center justify-center text-tw-teal font-bold text-xs">
          SR
        </div>
      </div>
    </header>
  );
}
