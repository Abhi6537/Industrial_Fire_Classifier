import React from "react";
import { IncidentStatus } from "@/lib/mockData";

const STATUS_CONFIG: Record<
  IncidentStatus | "Operational" | "Maintenance" | "Offline",
  { label: string; bg: string; color: string; border: string }
> = {
  open: {
    label: "Open",
    bg: "rgba(220,38,38,0.12)",
    color: "#ef4444",
    border: "rgba(220,38,38,0.3)",
  },
  monitoring: {
    label: "Monitoring",
    bg: "rgba(13,148,136,0.12)",
    color: "#14b8a6",
    border: "rgba(13,148,136,0.3)",
  },
  investigating: {
    label: "Investigating",
    bg: "rgba(202,138,4,0.12)",
    color: "#eab308",
    border: "rgba(202,138,4,0.3)",
  },
  closed: {
    label: "Closed",
    bg: "rgba(75,85,99,0.12)",
    color: "#9ca3af",
    border: "rgba(75,85,99,0.3)",
  },
  Operational: {
    label: "Operational",
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.3)",
  },
  Maintenance: {
    label: "Maintenance",
    bg: "rgba(217,119,6,0.12)",
    color: "#f59e0b",
    border: "rgba(217,119,6,0.3)",
  },
  Offline: {
    label: "Offline",
    bg: "rgba(75,85,99,0.12)",
    color: "#9ca3af",
    border: "rgba(75,85,99,0.3)",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status,
    bg: "rgba(75,85,99,0.12)",
    color: "#9ca3af",
    border: "rgba(75,85,99,0.3)",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
