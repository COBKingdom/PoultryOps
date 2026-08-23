"use client";

import {
  format,
} from "date-fns";

import {
  Bird,
  Layers3,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

import { useFlocks } from "@/hooks/useFlocks";
import { formatNumber } from "@/lib/currency";

type Props = {
  farmId?: string;
};

/*
 * Attractive flock presentation for the demo dashboard.
 *
 * Uses the existing useFlocks hook (no new data source).
 */
export default function DemoFlockShowcase({
  farmId,
}: Props) {
  const { flocks, loading } = useFlocks(farmId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <div
          className="
            h-4
            w-40
            animate-pulse
            rounded
            bg-slate-200"
        />
      </div>
    );
  }

  if (!flocks?.length) {
    return (
      <p className="text-sm text-slate-500">
        No active flocks on record yet.
      </p>
    );
  }

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
        lg:grid-cols-3"
    >
      {flocks.slice(0, 6).map((flock) => {
        const available = Number(
          flock.quantity || 0
        );

        return (
          <div
            key={flock.id}
            className="
              group
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              transition
              duration-200
              hover:shadow-md
              hover:-translate-y-0.5
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-green-50"
            >
              <Bird
                size={22}
                className="text-green-600"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-slate-900"
              >
                {flock.flock_name ||
                  "Unnamed flock"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {flock.breed || "Mixed breed"}
              </p>

              <div
                className="
                  mt-1.5
                  flex
                  items-center
                  gap-4
                  text-xs
                  text-slate-600"
              >
                <span className="flex items-center gap-1">
                  <Layers3 size={12} />
                  {formatNumber(available)} birds
                </span>

                <span className="flex items-center gap-1">
                  <CalendarDays size={12} />
                  Started{" "}
                  {flock.created_at
                    ? format(
                        new Date(flock.created_at),
                        "PP"
                      )
                    : "—"}
                </span>
              </div>
            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-1
                rounded-full
                bg-green-50
                px-2
                py-1
                text-xs
                font-medium
                text-green-700"
            >
              <CheckCircle2
                size={12}
                className="text-green-500"
              />
              Active
            </div>
          </div>
        );
      })}
    </div>
  );
}