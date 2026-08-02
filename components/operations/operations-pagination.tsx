"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type OperationsPaginationProps = {
  /** Current page number (1-based) */
  current: number;
  /** Total number of pages */
  total: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items */
  totalItems?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
};

export default function OperationsPagination({
  current,
  total,
  pageSize,
  totalItems,
  onPageChange,
}: OperationsPaginationProps) {
  if (total <= 1) return null;

  // Build visible page numbers (with ellipsis for large ranges)
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push("ellipsis");
    }

    pages.push(total);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Items info */}
      {pageSize && totalItems !== undefined && (
        <div className="text-sm text-slate-500">
          Showing {Math.min((current - 1) * pageSize + 1, totalItems)}–
          {Math.min(current * pageSize, totalItems)} of {totalItems}
        </div>
      )}

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-slate-400 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === current
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current >= total}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
