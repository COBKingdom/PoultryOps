"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import { formatCurrency } from "@/lib/currency";

type Props = {
  revenue: number;
  expenses: number;
  currency?: string;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function RevenueChart({
  revenue,
  expenses,
  currency,
}: Props) {
  // Display-only transform: chart axis/bar values are shown in millions.
  const data = [
    {
      name: "Revenue",
      value: Number((revenue / 1000000).toFixed(2)),
      color: "#16a34a",
    },
    {
      name: "Expenses",
      value: Number((expenses / 1000000).toFixed(2)),
      color: "#dc2626",
    },
  ];

  const symbol = CURRENCY_SYMBOLS[currency || "NGN"] || "₦";

  const formatAxisValue = (value: number) => {
    if (value === 0) return `${symbol}0`;
    return `${symbol}${value}m`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Revenue vs Expenses
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Financial performance overview
        </p>
      </div>

      <div className="h-80">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <XAxis dataKey="name" />

            <YAxis
              width={80}
              tickFormatter={formatAxisValue}
            />

            <Tooltip
              formatter={(value) =>
                formatCurrency(
                  Number(value) * 1000000,
                  { currency }
                )
              }
            />

            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
            >
              {data.map(
                (entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                  />
                )
              )}
            </Bar>

          </BarChart>
        </ResponsiveContainer>

      </div>

      <p className="text-xs text-slate-400 mt-3">
        Amount ({symbol} millions)
      </p>

    </div>
  );
}