"use client";

import React, { useState } from "react";
import { Alert, postAlertComment, acknowledgeAlert } from "@/lib/api";
import { MessageSquare, Send, CheckCircle2, ShieldAlert, User, Clock } from "lucide-react";

interface AlertThreadProps {
  alert: Alert | null;
  onClose?: () => void;
  onRefresh?: () => void;
}

export const AlertThread: React.FC<AlertThreadProps> = ({
  alert,
  onClose,
  onRefresh,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-surface border border-surfaceBorder rounded-xl">
        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-xs">Select an alert from the queue to view incident intelligence & dispatch notes.</p>
      </div>
    );
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const success = await postAlertComment(alert.id, commentText.trim());
    if (success) {
      alert.comments.push({
        id: `c-temp-${Date.now()}`,
        author: "Analyst Operator",
        comment: commentText.trim(),
        created_at: new Date().toISOString(),
      });
      setCommentText("");
      if (onRefresh) onRefresh();
    }
    setIsSubmitting(false);
  };

  const handleAcknowledge = async () => {
    const success = await acknowledgeAlert(alert.id);
    if (success) {
      alert.status = "acknowledged";
      alert.acknowledged_at = new Date().toISOString();
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-slate-900 font-sans select-none shadow-xs">
      {/* Thread Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 line-clamp-1">{alert.title}</h3>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
              alert.status === "unread"
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}
          >
            {alert.status}
          </span>
        </div>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{alert.description}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Telemetry Logged: {new Date(alert.created_at).toLocaleTimeString()}</span>
          </div>

          {alert.status === "unread" && (
            <button
              onClick={handleAcknowledge}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-sans font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          )}
        </div>
      </div>

      {/* Discussion Timeline */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 font-mono mb-0.5">
          Analyst Tactical Log ({alert.comments?.length || 0})
        </div>

        {alert.comments && alert.comments.length > 0 ? (
          alert.comments.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-800">
                  <User className="w-3 h-3 text-blue-600" />
                  <span>{c.author}</span>
                </div>
                <span>{new Date(c.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-700 mt-1 leading-relaxed text-xs">{c.comment}</p>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-400 italic p-8 text-center font-mono">
            No analyst dispatch notes logged for this incident.
          </div>
        )}
      </div>

      {/* Comment Input */}
      <form onSubmit={handlePostComment} className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Log incident assessment or NDRF dispatch observation..."
          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
        />
        <button
          type="submit"
          disabled={isSubmitting || !commentText.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-sans font-semibold transition flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post Note</span>
        </button>
      </form>
    </div>
  );
};
