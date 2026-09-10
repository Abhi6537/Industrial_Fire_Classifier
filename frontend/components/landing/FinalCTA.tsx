import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      className="py-24 px-6 border-t border-tw-border relative overflow-hidden text-center"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,148,136,0.12) 0%, transparent 70%), #0a0e1a",
      }}
    >
      {/* Background industrial graphic pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(249,87,56,0.15) 0%, transparent 60%)
          `,
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        <p className="text-tw-teal text-xs font-bold uppercase tracking-widest">
          Get Started
        </p>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tw-text tracking-tight leading-tight">
          See the Heat.
          <br />
          <span className="text-tw-teal">Understand the Threat.</span>
        </h2>

        <p className="text-tw-muted text-base max-w-xl mx-auto leading-relaxed">
          Turning satellite data into actionable geospatial intelligence.
        </p>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#f95738] to-[#ff3b30] hover:from-[#ff6b4a] hover:to-[#f95738] text-white text-base font-bold rounded-xl shadow-xl shadow-tw-orange/25 transition-all hover:scale-105"
          >
            Launch the Intelligence Map
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
