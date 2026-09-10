import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tw-navy text-tw-text font-sans antialiased selection:bg-tw-teal/30 selection:text-tw-text flex flex-col justify-between">
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[85vh] pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden flex-1"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(120,134,107,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 20% 70%, rgba(38,42,36,0.5) 0%, transparent 60%),
            #141714
          `,
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 py-8">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-tw-text leading-[1.08] tracking-tight">
            Detect. Classify. <span className="text-tw-orange">Prevent.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-tw-muted text-base sm:text-xl leading-relaxed max-w-2xl mx-auto">
            AI-powered detection and classification of industrial fires and persistent thermal sources using NASA FIRMS, OpenStreetMap and satellite data.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-tw-orange hover:bg-tw-orange-hi text-tw-text font-bold text-sm rounded-xl shadow-lg shadow-tw-orange/20 border border-tw-text/15 transition-all hover:scale-[1.02]"
            >
              Open Live Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#solution"
              className="inline-flex items-center gap-2 px-7 py-4 bg-tw-surface/80 border border-tw-border hover:border-tw-border-hi text-tw-text font-semibold text-sm rounded-xl transition-colors backdrop-blur-sm"
            >
              Learn More
              <ChevronRight className="w-4 h-4 text-tw-muted" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. FOOTER */}
      <Footer />
    </div>
  );
}
