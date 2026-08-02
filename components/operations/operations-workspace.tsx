"use client";

import { ReactNode } from "react";

import AppShell from "@/components/layout/app-shell";

type OperationsWorkspaceProps = {
  /** Page title displayed in the header */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Farm ID for context (passed to children as needed) */
  farmId?: string;
  /** Loading state — shows skeleton while data loads */
  loading?: boolean;
  /** Optional KPI summary cards rendered above the activity list */
  kpiCards?: ReactNode;
  /** Optional sticky quick-entry panel (e.g. AddEggForm) */
  quickEntry?: ReactNode;
  /** Optional filter / search toolbar */
  toolbar?: ReactNode;
  /** Optional pagination controls */
  pagination?: ReactNode;
  /** Main activity list content */
  children: ReactNode;
};

export default function OperationsWorkspace({
  title,
  subtitle,
  farmId,
  loading = false,
  kpiCards,
  quickEntry,
  toolbar,
  pagination,
  children,
}: OperationsWorkspaceProps) {
  return (
    <AppShell email={undefined}>
      <div className="space-y-6">
        {/* ── Standard page header ───────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* ── KPI cards section ─────────────────────────────────────────── */}
        {kpiCards && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards}
          </div>
        )}

        {/* ── Filter / Search toolbar ───────────────────────────────────── */}
        {toolbar && (
          <div className="flex items-center justify-between">
            {toolbar}
          </div>
        )}

        {/* ── Main content: Activity list + Sticky Quick Entry ─────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Activity list container (spans 8 of 12 columns on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              children
            )}
          </div>

          {/* Sticky Quick Entry panel (spans 4 of 12 columns) */}
          {quickEntry && (
            <div className="lg:col-span-4">
              <div className="sticky top-20 space-y-4">
                {quickEntry}
              </div>
            </div>
          )}
        </div>

        {/* ── Pagination area ───────────────────────────────────────────── */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}
      </div>
    </AppShell>
  );
}
