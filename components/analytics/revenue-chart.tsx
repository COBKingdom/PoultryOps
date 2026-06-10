"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
    },
    {
      name: "Expenses",
      value: expenses,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Revenue vs Expenses
      </h2>

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
            />
          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}