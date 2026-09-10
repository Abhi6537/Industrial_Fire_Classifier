"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, Maximize2, X } from "lucide-react";

interface WorkflowStep {
  id: string;
  stepNumber: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  metrics: { label: string; value: string }[];
  highlights: string[];
}

const STEPS: WorkflowStep[] = [
  {
    id: "ingestion",
    stepNumber: "01",
    category: "Telemetry Ingestion",
    title: "Real-time satellite detection feed",
    subtitle: "NASA FIRMS MODIS & VIIRS telemetry stream",
    description:
      "Ingests raw satellite thermal anomaly data every 15 minutes, measuring sub-pixel infrared radiance and brightness temperatures directly from orbit.",
    image: "/screenshots/step1.png",
    metrics: [
      { label: "Refresh", value: "< 15m" },
      { label: "Sensors", value: "VIIRS / MODIS" },
      { label: "Latency", value: "< 120s" },
    ],
    highlights: [
      "Sub-pixel infrared radiance extraction",
      "Global latitude coverage",
      "Automated satellite pass alignment",
    ],
  },
  {
    id: "classification",
    stepNumber: "02",
    category: "Contextual AI",
    title: "Geospatial infrastructure fusion",
    subtitle: "OpenStreetMap & facility baseline matching",
    description:
      "Cross-references satellite heat detections against facility boundaries, refinery stack flare baselines, and land-use maps to eliminate routine false alarms.",
    image: "/screenshots/step2.png",
    metrics: [
      { label: "Accuracy", value: "98.4%" },
      { label: "False Alarms", value: "-87%" },
      { label: "Layers", value: "OSM + Satellite" },
    ],
    highlights: [
      "Refinery stack flare baseline matching",
      "Facility perimeter proximity checks",
      "Multi-layer land-cover analysis",
    ],
  },
  {
    id: "analytics",
    stepNumber: "03",
    category: "GIS Analytics",
    title: "Spatial heatmaps & persistence",
    subtitle: "Interactive cluster map & hazard scoring",
    description:
      "Renders dynamic spatial heatmaps, persistence metrics, and multi-tier hazard severity scores across industrial facilities in real time.",
    image: "/screenshots/step3.png",
    metrics: [
      { label: "Engine", value: "Leaflet GIS" },
      { label: "Resolution", value: "375m / px" },
      { label: "Hazard Tiers", value: "5 Levels" },
    ],
    highlights: [
      "Live heat distribution intensity maps",
      "Persistent thermal source tracking",
      "Layered facility boundary controls",
    ],
  },
  {
    id: "alerting",
    stepNumber: "04",
    category: "Response & Alerts",
    title: "Automated emergency dispatch",
    subtitle: "Instant incident payload & escalation",
    description:
      "Triggers instant high-priority alerts to site safety officers and emergency services with precise GPS coordinates and automated report logs.",
    image: "/screenshots/step4.png",
    metrics: [
      { label: "Dispatch", value: "Instant" },
      { label: "Reports", value: "Automated" },
      { label: "Escalation", value: "Real-time" },
    ],
    highlights: [
      "Precise GPS coordinates & routing data",
      "Emergency call escalation triggers",
      "Complete audit log & incident timeline",
    ],
  },
];

function StepRow({
  step,
  index,
  onExpand,
}: {
  step: WorkflowStep;
  index: number;
  onExpand: (img: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const isImageLeft = index % 2 === 0;

  useEffect(() => {
    // Fallback timer to ensure elements are always visible regardless of browser observer support
    const timer = setTimeout(() => setIsVisible(true), 150);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      clearTimeout(timer);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const textBlock = (
    <div className="space-y-6">
      {/* Category & Step Number */}
      <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-[#98a092]">
        <span className="text-[#c05621] font-semibold">{step.stepNumber}</span>
        <span className="text-[#60675b]">•</span>
        <span className="uppercase">{step.category}</span>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <h3 className="text-2xl sm:text-3xl font-semibold text-[#e8e4d9] tracking-tight leading-snug">
          {step.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#98a092]">{step.subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-sm text-[#98a092] leading-relaxed max-w-md">
        {step.description}
      </p>

      {/* Key Highlights */}
      <div className="space-y-2 pt-1">
        {step.highlights.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs text-[#e8e4d9]/80">
            <Check className="w-3.5 h-3.5 text-[#78866b] flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Simple Stats Row */}
      <div className="pt-4 flex items-center gap-8 border-t border-[#2f352e]">
        {step.metrics.map((m, i) => (
          <div key={i} className="space-y-0.5">
            <div className="text-[10px] text-[#60675b] uppercase font-mono tracking-wider">
              {m.label}
            </div>
            <div className="text-sm font-semibold text-[#e8e4d9] font-mono">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const imageBlock = (
    <div className="relative group">
      {/* Clean Screenshot Frame - No heavy card, no glows, no HUD brackets */}
      <div className="relative rounded-xl overflow-hidden border border-[#2f352e] bg-[#141714] shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
        <div
          className="relative w-full"
          style={{ position: "relative", width: "100%", height: "420px" }}
        >
          <Image
            src={step.image}
            alt={step.title}
            fill
            quality={95}
            priority
            style={{ objectFit: "cover", objectPosition: "top" }}
            className="object-cover object-top"
          />

          {/* Minimal Expand Overlay */}
          <button
            onClick={() => onExpand(step.image)}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-md bg-[#1c1f1b]/90 border border-[#2f352e] hover:border-[#454e43] text-xs font-medium text-[#e8e4d9] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
          >
            <Maximize2 className="w-3 h-3 text-[#98a092]" />
            Expand
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className={`py-12 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {isImageLeft ? (
          <>
            <div className="lg:col-span-7">{imageBlock}</div>
            <div className="lg:col-span-5">{textBlock}</div>
          </>
        ) : (
          <>
            <div className="lg:col-span-5">{textBlock}</div>
            <div className="lg:col-span-7">{imageBlock}</div>
          </>
        )}
      </div>
    </div>
  );
}

export function WorkflowWalkthrough() {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <section id="workflow" className="py-24 px-6 bg-[#141714] border-t border-[#2f352e]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Editorial Clean Header */}
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-mono text-[#c05621] uppercase tracking-widest font-semibold">
            System Workflow
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#e8e4d9] tracking-tight leading-tight">
            How ThermoWatch processes thermal activity
          </h2>
          <p className="text-sm text-[#98a092] leading-relaxed">
            An end-to-end overview of data acquisition, AI classification, spatial mapping, and incident dispatch.
          </p>
        </div>

        {/* Clean Alternating Steps */}
        <div className="divide-y divide-[#2f352e]/60">
          {STEPS.map((step, idx) => (
            <StepRow
              key={step.id}
              step={step}
              index={idx}
              onExpand={(img) => setExpandedImage(img)}
            />
          ))}
        </div>
      </div>

      {/* Clean Fullscreen Modal */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full bg-[#1c1f1b] border border-[#2f352e] rounded-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-[#2f352e] flex items-center justify-between">
              <span className="text-xs font-mono text-[#98a092]">System View</span>
              <button
                onClick={() => setExpandedImage(null)}
                className="p-1 rounded text-[#98a092] hover:text-[#e8e4d9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className="relative w-full bg-black"
              style={{ position: "relative", width: "100%", height: "600px" }}
            >
              <Image
                src={expandedImage}
                alt="Full screen preview"
                fill
                style={{ objectFit: "contain" }}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
