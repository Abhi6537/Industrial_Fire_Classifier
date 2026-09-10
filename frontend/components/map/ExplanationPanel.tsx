"use client";

import React from "react";
import { ClassifiedEvent } from "@/lib/api";
import { AlertTriangle, Flame, ShieldAlert, CheckCircle2, ChevronRight, X, Cpu } from "lucide-react";

interface ExplanationPanelProps {
  event: ClassifiedEvent | null;
  onClose: () => void;
  onAcknowledge?: (eventId: string) => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  event,
  onClose,
  onAcknowledge,
}) => {
  if (!event) return null;

  const isCritical = event.severity === "critical";
  const isWarning = event.severity === "warning";

  return (
    <div className="absolute top-4 right-4 z-[1000] w-96 max-h-[90vh] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-5 overflow-y-auto text-slate-800 flex flex-col gap-4 font-sans animate-in fade-in slide-in-from-right-2 duration-150 select-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          {isCritical ? (
            <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          ) : isWarning ? (
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-900 font-sans">
              {event.label.replace(/_/g, " ")}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Inference Confidence: <strong className="text-blue-600 font-semibold">{Math.round(event.confidence * 100)}%</strong>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Telemetry Readout Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="text-slate-500 text-[10px] uppercase font-mono font-semibold">FRP Output</div>
          <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
            {event.shap_explanation?.metrics?.frp_mw ?? 165.8} <span className="text-[10px] font-normal text-slate-500">MW</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="text-slate-500 text-[10px] uppercase font-mono font-semibold">Z-Deviation</div>
          <div
            className={`text-sm font-extrabold font-mono mt-0.5 ${
              event.deviation_score > 2.0 ? "text-red-600" : "text-slate-700"
            }`}
          >
            {event.deviation_score > 0 ? `+${event.deviation_score.toFixed(1)}` : event.deviation_score.toFixed(1)}σ
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="text-slate-500 text-[10px] uppercase font-mono font-semibold">Night Passes</div>
          <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
            {event.persistence_count}
          </div>
        </div>
      </div>

      {/* Facility & GIS Coordinates Context */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Facility:</span>
          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{event.site_name || "Unmapped Location"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Land Cover (ESA):</span>
          <span className="capitalize text-slate-800 font-sans font-medium">{event.land_cover_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Coordinates:</span>
          <span className="text-slate-800">
            {event.latitude.toFixed(4)}°N, {event.longitude.toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* Explainability / SHAP Decision Factors */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 font-sans">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>SHAP Attribution Breakdown (&phi;<sub>i</sub>)</span>
          </div>
          {event.shap_explanation?.base_value !== undefined && (
            <span className="text-[10px] font-mono text-slate-500">
              E[f(x)]: <strong>{(event.shap_explanation.base_value * 100).toFixed(1)}%</strong>
            </span>
          )}
        </div>

        {/* Visual Diverging SHAP Bar Chart */}
        {event.shap_explanation?.shap_factors && event.shap_explanation.shap_factors.length > 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-200 pb-1">
              <span>FEATURE & VALUE</span>
              <span>ATTRIBUTION (&phi;)</span>
            </div>
            {event.shap_explanation.shap_factors.slice(0, 5).map((f, idx) => {
              const isPos = f.shap_value >= 0;
              const maxVal = Math.max(...(event.shap_explanation?.shap_factors?.map(x => Math.abs(x.shap_value)) || [0.5]), 0.4);
              const barWidthPct = Math.min(Math.round((Math.abs(f.shap_value) / maxVal) * 100), 100);

              return (
                <div key={idx} className="flex flex-col gap-0.5 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-700 font-medium truncate max-w-[210px]">
                      {f.label}
                      <span className="text-slate-400 font-mono text-[10px] ml-1">
                        ({f.value}{f.unit ? ` ${f.unit}` : ""})
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isPos ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {isPos ? `+${f.shap_value.toFixed(3)}` : f.shap_value.toFixed(3)}
                    </span>
                  </div>
                  {/* Diverging Bar */}
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden flex">
                    {isPos ? (
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    ) : (
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Operational Intelligence Synthesis Bullets */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex flex-col gap-2">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400">Operational Synthesis</div>
          {event.shap_explanation?.primary_factors?.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          )) || (
            <div className="text-slate-500 italic text-xs">No explainability drivers recorded.</div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-2 border-t border-slate-200 flex gap-2">
        {onAcknowledge && (
          <button
            onClick={() => onAcknowledge(event.id)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Acknowledge Event</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
