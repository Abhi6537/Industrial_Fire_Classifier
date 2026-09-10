import React from "react";
import { SeverityLevel } from "@/lib/mockData";

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; bg: string; color: string; border: string }
> = {
  high: {
    label: "High",
    bg: "rgba(220,38,38,0.15)",
    color: "#ef4444",
    border: "rgba(220,38,38,0.35)",
  },
  medium: {
    label: "Medium",
    bg: "rgba(217,119,6,0.15)",
    color: "#f59e0b",
    border: "rgba(217,119,6,0.35)",
  },
  low: {
    label: "Low",
    bg: "rgba(34,197,94,0.15)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.35)",
  },
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}
