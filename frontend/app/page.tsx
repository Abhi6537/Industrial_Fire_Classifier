import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { WorkflowWalkthrough } from "@/components/landing/WorkflowWalkthrough";
import { ImpactSection } from "@/components/landing/ImpactSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tw-navy text-tw-text font-sans antialiased selection:bg-tw-teal/30 selection:text-tw-text flex flex-col justify-between">
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. FULL-SCREEN ANIMATED SATELLITE HERO SECTION */}
      <HeroSection />

      {/* 3. WORKFLOW WALKTHROUGH SECTION */}
      <WorkflowWalkthrough />

      {/* 4. OPERATIONAL IMPACT SECTION */}
      <ImpactSection />

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}

