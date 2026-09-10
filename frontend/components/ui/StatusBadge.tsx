import React from "react";
import { IncidentStatus } from "@/lib/mockData";

const STATUS_CONFIG: Record<
  IncidentStatus | "Operational" | "Maintenance" | "Offline",
  { label: string; bg: string; color: string; border: string }
> = {
  open: {
    label: "Open",
    bg: "rgba(229, 115, 115, 0.12)",
    color: "#e57373",
    border: "rgba(229, 115, 115, 0.25)",
  },
  monitoring: {
    label: "Monitoring",
    bg: "rgba(100, 181, 246, 0.12)",
    color: "#64b5f6",
    border: "rgba(100, 181, 246, 0.25)",
  },
  investigating: {
    label: "Investigating",
    bg: "rgba(255, 183, 77, 0.12)",
    color: "#ffb74d",
    border: "rgba(255, 183, 77, 0.25)",
  },
  closed: {
    label: "Closed",
    bg: "rgba(144, 164, 174, 0.12)",
    color: "#90a4ae",
    border: "rgba(144, 164, 174, 0.25)",
  },
  Operational: {
    label: "Operational",
    bg: "rgba(129, 199, 132, 0.12)",
    color: "#81c784",
    border: "rgba(129, 199, 132, 0.25)",
  },
  Maintenance: {
    label: "Maintenance",
    bg: "rgba(255, 183, 77, 0.12)",
    color: "#ffb74d",
    border: "rgba(255, 183, 77, 0.25)",
  },
  Offline: {
    label: "Offline",
    bg: "rgba(144, 164, 174, 0.12)",
    color: "#90a4ae",
    border: "rgba(144, 164, 174, 0.25)",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status,
    bg: "rgba(144, 164, 174, 0.12)",
    color: "#90a4ae",
    border: "rgba(144, 164, 174, 0.25)",
  };

  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}
