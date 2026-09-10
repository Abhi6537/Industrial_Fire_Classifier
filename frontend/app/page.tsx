import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroMap } from "@/components/landing/HeroMap";
import { CapabilityStrip } from "@/components/landing/CapabilityStrip";
import { ChallengeSolution } from "@/components/landing/ChallengeSolution";
import { ClassificationCards } from "@/components/landing/ClassificationCards";
import { AudienceCards } from "@/components/landing/AudienceCards";
import { LiveMapPreview } from "@/components/landing/LiveMapPreview";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tw-navy text-tw-text font-sans antialiased selection:bg-tw-teal/30 selection:text-tw-text">
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[90vh] pt-28 pb-16 px-6 flex items-center overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(13,148,136,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 20% 70%, rgba(30,45,69,0.4) 0%, transparent 60%),
            #0a0e1a
          `,
        }}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-8">
            {/* SIH Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tw-teal/10 border border-tw-teal/30 text-tw-teal text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-tw-teal animate-pulse" />
              <span>SIH PS 26162</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-tw-text leading-[1.05] tracking-tight">
              Detect.
              <br />
              Classify.
              <br />
              <span className="text-tw-teal">Prevent.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-tw-muted text-base sm:text-lg leading-relaxed max-w-xl">
              AI-powered detection and classification of industrial fires and persistent thermal sources using NASA FIRMS, OpenStreetMap and satellite data.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#f95738] to-[#ff3b30] hover:from-[#ff6b4a] hover:to-[#f95738] text-white font-bold text-sm rounded-xl shadow-xl shadow-tw-orange/25 transition-all hover:scale-[1.02]"
              >
                Open Live Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#solution"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-tw-surface/60 border border-tw-border hover:border-tw-border-hi text-tw-text font-semibold text-sm rounded-xl transition-colors backdrop-blur-sm"
              >
                Learn More
                <ChevronRight className="w-4 h-4 text-tw-muted" />
              </a>
            </div>
          </div>

          {/* Right Hero Map Visual */}
          <div className="lg:col-span-6 w-full">
            <HeroMap />
          </div>
        </div>
      </section>

      {/* 3. CAPABILITY STRIP */}
      <CapabilityStrip />

      {/* 4. CHALLENGE / SOLUTION */}
      <ChallengeSolution />

      {/* 5. CLASSIFICATION TYPES */}
      <ClassificationCards />

      {/* 6. WHO IT'S FOR */}
      <AudienceCards />

      {/* 7. LIVE MAP PREVIEW */}
      <LiveMapPreview />

      {/* 8. IMPACT SECTION */}
      <ImpactSection />

      {/* 9. FINAL CTA */}
      <FinalCTA />

      {/* 10. FOOTER */}
      <Footer />
    </div>
  );
}
