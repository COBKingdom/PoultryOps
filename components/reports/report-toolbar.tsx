"use client";

import { CalendarRange } from "lucide-react";

import ReportFilter from "./report-filter";
import {
  DateRangeSelection,
  getPresetLabel,
  formatDateRange,
} from "@/lib/date-ranges";

type Props = {
  value: DateRangeSelection;
  onChange: (selection: DateRangeSelection) => void;
  /**
   * Optional children rendered on the right side of the toolbar,
   * beside the filter (e.g. Export PDF / Export Excel buttons).
   */
  children?: React.ReactNode;
};

export default function ReportToolbar({ value, onChange, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
      {/* Left — selected period label */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <CalendarRange size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide leading-tight">
            {getPresetLabel(value.preset)}
          </p>
          <p className="text-sm font-semibold text-slate-700 truncate leading-tight">
            {formatDateRange(value.range)}
          </p>
        </div>
      </div>

      {/* Right — filter + optional action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}
        <ReportFilter value={value} onChange={onChange} />
      </div>
    </div>
  );
}