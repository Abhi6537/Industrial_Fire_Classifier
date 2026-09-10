import React from "react";
import { SeverityLevel } from "@/lib/mockData";

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; bg: string; color: string; border: string }
> = {
  high: {
    label: "High",
    bg: "rgba(229, 115, 115, 0.12)",
    color: "#e57373",
    border: "rgba(229, 115, 115, 0.25)",
  },
  medium: {
    label: "Medium",
    bg: "rgba(255, 183, 77, 0.12)",
    color: "#ffb74d",
    border: "rgba(255, 183, 77, 0.25)",
  },
  low: {
    label: "Low",
    bg: "rgba(129, 199, 132, 0.12)",
    color: "#81c784",
    border: "rgba(129, 199, 132, 0.25)",
  },
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;

  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}
