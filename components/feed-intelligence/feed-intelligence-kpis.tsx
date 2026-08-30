"use client";

import {
  Activity,
  CalendarDays,
  Package,
  Users,
} from "lucide-react";

type Props = {
  totalFeedConsumedKg: number;
  averageDailyFeedKg: number;
  currentFlockCount: number;
  selectedFlockBirds?: number;
};

function formatNumber(
  value: number
) {
  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

export default function FeedIntelligenceKpis({
  totalFeedConsumedKg,
  averageDailyFeedKg,
  currentFlockCount,
  selectedFlockBirds,
}: Props) {
  const cards = [
    {
      title:
        "Feed Consumed",
      value: `${formatNumber(
        totalFeedConsumedKg
      )} kg`,
      subtitle:
        "Actual feed recorded",
      icon: Package,
    },
    {
      title:
        "Average Daily",
      value: `${formatNumber(
        averageDailyFeedKg
      )} kg`,
      subtitle:
        "Average consumption",
      icon: CalendarDays,
    },
    {
      title:
        "Flocks Analysed",
      value: formatNumber(
        currentFlockCount
      ),
      subtitle:
        "Active flocks",
      icon: Activity,
    },
    {
      title:
        "Selected Flock Birds",
      value:
        selectedFlockBirds !==
        undefined
          ? formatNumber(
              selectedFlockBirds
            )
          : "—",
      subtitle:
        "Starting flock quantity",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(
        ({
          title,
          value,
          subtitle,
          icon: Icon,
        }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {title}
              </p>

              <div className="rounded-xl bg-blue-50 p-2">
                <Icon
                  size={18}
                  className="text-blue-600"
                />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {value}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>
        )
      )}
    </div>
  );
}