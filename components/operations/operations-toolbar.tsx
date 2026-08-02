"use client";

import { ReactNode } from "react";

import { Search } from "lucide-react";

type OperationsToolbarProps = {
  /** Optional search placeholder text */
  searchPlaceholder?: string;
  /** Current search query value */
  searchValue?: string;
  /** Callback when search input changes */
  onSearchChange?: (value: string) => void;
  /** Optional action buttons rendered on the right side */
  actions?: ReactNode;
  /** Optional page-specific controls rendered between search and actions */
  children?: ReactNode;
};

export default function OperationsToolbar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  actions,
  children,
}: OperationsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
      {/* Left — search input */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Center — optional page-specific controls */}
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}

      {/* Right — optional action buttons */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
