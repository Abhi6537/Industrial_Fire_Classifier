"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Satellite, ArrowDown } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#141714] text-[#e8e4d9]"
    >
      {/* 1. Full-Screen Background Image with Continuous Pan/Zoom Motion */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/hero-satellite.jpg"
          alt="Orbital Satellite Scanning Earth Thermal Anomalies"
          fill
          priority
          quality={100}
          style={{ objectFit: "cover", objectPosition: "center" }}
          className="object-cover animate-hero-pan filter brightness-90 contrast-105"
        />

        {/* Ambient Dark Gradient Overlays for High Legibility & Seamless Blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-[#141714]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#141714]/40 to-[#141714]" />

        {/* Dynamic Scanning Cone Glow Animation */}
        <div className="absolute inset-0 bg-cyan-500/5 mix-blend-screen animate-beam-scan" />

        {/* Live Thermal Anomaly Pulse Markers on Map Surface */}
        <div className="absolute top-[52%] left-[54%] w-3 h-3 rounded-full bg-red-500/90 shadow-[0_0_12px_#ef4444]">
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
        </div>
        <div className="absolute top-[58%] left-[51%] w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-[0_0_10px_#f59e0b]">
          <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
        </div>
        <div className="absolute top-[48%] left-[57%] w-2.5 h-2.5 rounded-full bg-orange-500/90 shadow-[0_0_10px_#f97316]">
          <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
        </div>
      </div>

      {/* Spacer to push content down past floating Navbar */}
      <div className="pt-28" />

      {/* 2. Hero Center Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 my-auto py-12">
        {/* Real-time Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1c1f1b]/80 border border-[#2f352e] text-xs font-mono text-[#e8e4d9] backdrop-blur-md shadow-xl">
          <Satellite className="w-3.5 h-3.5 text-[#c05621] animate-pulse" />
          <span className="text-[#98a092]">NASA FIRMS MODIS &amp; VIIRS TELEMETRY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-semibold uppercase text-[10px]">LIVE SCANNING</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-[#e8e4d9] leading-[1.05] tracking-tight">
          Detect. Classify. <span className="text-[#c05621]">Prevent.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#98a092] max-w-2xl mx-auto leading-relaxed font-normal">
          AI-powered orbital thermal intelligence mapping industrial fire risks, refinery stack flares, and persistent heat sources in real time.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#c05621] hover:bg-[#dd6b20] text-white font-bold text-sm rounded-xl shadow-xl shadow-[#c05621]/20 border border-white/10 transition-all hover:scale-[1.02]"
          >
            Open Live Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#workflow"
            className="inline-flex items-center gap-2 px-7 py-4 bg-[#1c1f1b]/80 border border-[#2f352e] hover:border-[#454e43] text-[#e8e4d9] font-semibold text-sm rounded-xl transition-colors backdrop-blur-md"
          >
            Learn More
            <ChevronRight className="w-4 h-4 text-[#98a092]" />
          </a>
        </div>
      </div>

      {/* 3. Bottom Scroll Indicator */}
      <div className="relative z-10 pb-8 text-center">
        <a
          href="#workflow"
          className="inline-flex flex-col items-center gap-2 text-xs font-mono text-[#98a092] hover:text-[#e8e4d9] transition-colors group"
        >
          <span className="uppercase tracking-widest text-[10px]">SCROLL TO EXPLORE WORKFLOW</span>
          <ArrowDown className="w-4 h-4 text-[#c05621] animate-bounce" />
        </a>
      </div>
    </section>
  );
}
