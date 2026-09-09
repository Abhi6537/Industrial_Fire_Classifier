"use client";

import React, { useState } from "react";
import { Alert, acknowledgeAlert } from "@/lib/api";
import { ShieldAlert, AlertTriangle, CheckCircle, MessageSquare, Clock } from "lucide-react";

interface AlertFeedProps {
  alerts: Alert[];
  selectedAlertId?: string;
  onSelectAlert: (alert: Alert) => void;
  onRefresh?: () => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onRefresh,
}) => {
  const [localAlerts, setLocalAlerts] = useState<Alert[]>(alerts);

  const handleAcknowledge = async (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    const success = await acknowledgeAlert(alertId);
    if (success) {
      setLocalAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "acknowledged" } : a))
      );
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden font-sans select-none shadow-xs">
      {/* Feed Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Tactical Alert Queue
          </h2>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-mono font-bold">
          {localAlerts.filter((a) => a.status === "unread").length} Unresolved
        </span>
      </div>

      {/* Alert Items List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {localAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic font-mono">
            No active emergency alerts in sector.
          </div>
        ) : (
          localAlerts.map((alert) => {
            const isUnread = alert.status === "unread";
            const isSelected = alert.id === selectedAlertId;
            const isCritical = alert.severity === "critical";

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-3 rounded-lg border transition cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-xs"
                    : isUnread
                    ? isCritical
                      ? "bg-red-50/40 border-l-4 border-l-red-600 border-red-200 hover:bg-red-50/70"
                      : "bg-amber-50/40 border-l-4 border-l-amber-500 border-amber-200 hover:bg-amber-50/70"
                    : "bg-white border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCritical ? "bg-red-600" : "bg-amber-500"
                      }`}
                    />
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 font-sans">
                      {alert.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                      isUnread
                        ? isCritical
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-slate-500 font-sans">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>{alert.comments?.length || 0}</span>
                    </div>

                    {isUnread && (
                      <button
                        onClick={(e) => handleAcknowledge(e, alert.id)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-sans font-medium transition shadow-2xs"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
