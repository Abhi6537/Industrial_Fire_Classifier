"use client";

import React, { useEffect, useState } from "react";
import { fetchAuditLog, AuditRecord } from "@/lib/api";
import { FileText, Shield, Clock, Search, Filter } from "lucide-react";

export default function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    async function loadAudit() {
      const data = await fetchAuditLog();
      setRecords(data);
    }
    loadAudit();
  }, []);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.analyst_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.note && r.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === "all" || r.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="flex-1 flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-5 overflow-y-auto font-sans select-none bg-slate-50">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900 font-sans">
              Analyst Action Audit Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable compliance record of all operator queries, triage decisions, and dispatch actions.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search analyst or action..."
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
          >
            <option value="all">All Actions</option>
            <option value="ACKNOWLEDGE_ALERT">ACKNOWLEDGE_ALERT</option>
            <option value="ADD_COMMENT">ADD_COMMENT</option>
            <option value="INFERENCE_QUERY">INFERENCE_QUERY</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Operator / Analyst</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Event ID</th>
                <th className="py-3 px-4">Action Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(record.acted_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {record.analyst_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          record.action === "ACKNOWLEDGE_ALERT"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : record.action === "ADD_COMMENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {record.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {record.event_id}
                    </td>
                    <td className="py-3 px-4 text-slate-800 text-xs font-sans">
                      {record.note || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic font-mono text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
