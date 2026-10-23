
"use client";

import { ReactNode } from "react";
import { formatCurrency } from "@/lib/currency";

type OperationsKpiCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  valueColor?: "slate" | "blue" | "green" | "red" | "amber" | "indigo";
  iconBg?: "blue" | "green" | "red" | "amber" | "indigo" | "slate";
  currency?: string;
};

const colorMap = {
  value: {
    slate: "text-slate-900",
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
    indigo: "text-indigo-600",
  },
  iconBg: {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-100 text-slate-600",
  },
};

export default function OperationsKpiCard({
  label,
  value,
  sublabel,
  icon,
  valueColor = "slate",
  iconBg = "slate",
  currency,
}: OperationsKpiCardProps) {
const displayValue =
  typeof value === "string"
    ? value
    : currency
      ? formatCurrency(value, { currency })
      : value.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Blue accent */}
      <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">
              {label}
            </p>

            <p
              className={`mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl ${colorMap.value[valueColor]}`}
            >
              {displayValue}
            </p>

            {sublabel && (
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {sublabel}
              </p>
            )}
          </div>

          {icon && (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/[0.03] ${colorMap.iconBg[iconBg]}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
