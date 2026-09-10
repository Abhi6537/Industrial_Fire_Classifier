"use client";

import React from "react";

interface ThermalChartProps {
  data: { date: string; radiance: number; baseline: number }[];
}

export function ThermalChart({ data }: ThermalChartProps) {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 180;
  const padding = 30;

  const maxVal = 200;

  const pointsRadiance = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.radiance / maxVal) * (height - padding * 2);
    return { x, y, val: d.radiance, date: d.date };
  });

  const pointsBaseline = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.baseline / maxVal) * (height - padding * 2);
    return { x, y };
  });

  const pathRadiance = pointsRadiance
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const pathBaseline = pointsBaseline
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-48 overflow-visible"
      >
        {/* Horizontal grid lines */}
        {[0, 50, 100, 150, 200].map((val) => {
          const y = height - padding - (val / maxVal) * (height - padding * 2);
          return (
            <g key={val}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#1e2d45"
                strokeDasharray="3 3"
              />
              <text
                x={padding - 6}
                y={y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Baseline Path (dash blue) */}
        <path
          d={pathBaseline}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Radiance Path (red solid) */}
        <path
          d={pathRadiance}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
        />

        {/* Dots on Radiance Path */}
        {pointsRadiance.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.val > 100 ? "4" : "2.5"}
              fill={p.val > 100 ? "#ef4444" : "#0d9488"}
              stroke="#0a0e1a"
              strokeWidth="1"
            />
            {/* Label for x-axis */}
            <text
              x={p.x}
              y={height - 8}
              fill="#64748b"
              fontSize="9"
              textAnchor="middle"
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
