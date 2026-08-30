"use client";

import {
  BarChart3,
  Bird,
} from "lucide-react";

type FlockPerformance = {
  flockId: string;
  flockName: string;
  startingBirds: number;
  feedConsumedKg: number;
  averageDailyFeedKg: number;
  feedPerStartingBirdKg: number;
};

type Props = {
  flocks: FlockPerformance[];
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

export default function FlockFeedPerformance({
  flocks,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2">
            <BarChart3
              size={20}
              className="text-blue-600"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Flock Feed Performance
            </h2>

            <p className="mt-1 text-slate-500">
              Actual feed consumption for the selected period.
            </p>
          </div>
        </div>
      </div>

      {flocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Bird
            size={36}
            className="mx-auto text-slate-400"
          />

          <p className="mt-4 text-sm text-slate-500">
            No feed consumption has been recorded for the selected period.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Flock
                </th>

                <th className="pb-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                  Birds
                </th>

                <th className="pb-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                  Feed Consumed
                </th>

                <th className="pb-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                  Avg / Day
                </th>

                <th className="pb-3 pl-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                  KG / Starting Bird
                </th>
              </tr>
            </thead>

            <tbody>
              {flocks.map(
                (flock) => (
                  <tr
                    key={
                      flock.flockId
                    }
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">
                        {
                          flock.flockName
                        }
                      </p>
                    </td>

                    <td className="py-4 px-4 text-right font-medium text-slate-700">
                      {formatNumber(
                        flock.startingBirds
                      )}
                    </td>

                    <td className="py-4 px-4 text-right font-semibold text-slate-900">
                      {formatNumber(
                        flock.feedConsumedKg
                      )}{" "}
                      kg
                    </td>

                    <td className="py-4 px-4 text-right font-medium text-slate-700">
                      {formatNumber(
                        flock.averageDailyFeedKg
                      )}{" "}
                      kg
                    </td>

                    <td className="py-4 pl-4 text-right font-semibold text-blue-600">
                      {formatNumber(
                        flock.feedPerStartingBirdKg
                      )}{" "}
                      kg
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}