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

type Props = {
  revenue: number;
  expenses: number;
};

export default function RevenueChart({
  revenue,
  expenses,
}: Props) {
  const data = [
    {
      name: "Revenue",
      value: revenue,
      color: "#16a34a",
    },
    {
      name: "Expenses",
      value: expenses,
      color: "#dc2626",
    },
  ];

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
          <BarChart data={data}>
            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

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

    </div>
  );
}