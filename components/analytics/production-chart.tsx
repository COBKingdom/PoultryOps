"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

type Props = {
  eggs: number;
  birds: number;
};

export default function ProductionChart({
  eggs,
  birds,
}: Props) {
  const data = [
    {
      name: "Eggs",
      value: eggs,
    },
    {
      name: "Birds",
      value: birds,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Production Overview
      </h2>

      <div className="h-80">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
            />

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}