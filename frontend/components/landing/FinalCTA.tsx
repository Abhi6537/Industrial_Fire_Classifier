import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      className="py-24 px-6 border-t border-tw-border relative overflow-hidden text-center"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(120,134,107,0.1) 0%, transparent 70%), #141714",
      }}
    >
      {/* Background industrial graphic pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(192,86,33,0.15) 0%, transparent 60%)
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
          <span className="text-tw-orange">Understand the Threat.</span>
        </h2>

        <p className="text-tw-muted text-base max-w-xl mx-auto leading-relaxed">
          Turning satellite data into actionable geospatial intelligence.
        </p>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 bg-tw-orange hover:bg-tw-orange-hi text-tw-text text-base font-bold rounded-xl shadow-lg shadow-tw-orange/20 border border-tw-text/15 transition-all hover:scale-105"
          >
            Launch the Intelligence Map
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
