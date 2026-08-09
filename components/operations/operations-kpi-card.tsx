"use client";

import { ReactNode } from "react";

import { formatCurrency } from "@/lib/currency";

type OperationsKpiCardProps = {
  /** Label displayed above the value */
  label: string;
  /** The main value to display */
  value: string | number;
  /** Optional sub-label below the value */
  sublabel?: string;
  /** Optional icon displayed on the right */
  icon?: ReactNode;
  /** Optional color variant for the value text */
  valueColor?: "slate" | "blue" | "green" | "red" | "amber" | "indigo";
  /** Optional background color for the icon container */
  iconBg?: "blue" | "green" | "red" | "amber" | "indigo" | "slate";
  /** Optional ISO currency code to format the value as money (e.g. "NGN") */
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
  const displayValue = currency
    ? formatCurrency(Number(value), { currency })
    : Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p
            className={`text-3xl font-bold mt-1 ${colorMap.value[valueColor]}`}
          >
            {displayValue}
          </p>
          {sublabel && (
            <p className="text-slate-400 text-xs mt-1">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap.iconBg[iconBg]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}