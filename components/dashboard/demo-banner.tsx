"use client";

import {
  Sparkles,
} from "lucide-react";

type Props = {
  farmName?: string;
};

/*
 * Prominent, always-visible DEMO MODE banner.
 * Rendered only when farm_code === "DEMO-001".
 */
export default function DemoBanner({
  farmName,
}: Props) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-r
        from-emerald-500
        via-teal-600
        to-cyan-700
        text-white
        shadow-xl
        ring-1
        ring-emerald-400/50
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -top-8
          -right-8
          w-40
          h-40
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      <div className="relative p-5 md:p-6">
        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                items-center
                justify-center
                w-11
                h-11
                rounded-xl
                bg-white/20
                ring-1
                ring-white/30
              "
            >
              <Sparkles
                size={22}
                className="text-white"
              />
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  opacity-90
                "
              >
                Demo Mode - PoultryOps Preview
              </p>

              <p
                className="
                  mt-0.5
                  text-xl
                  md:text-2xl
                  font-bold
                "
              >
                {farmName || "PoultryOps Demo Farm"}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  opacity-80
                "
              >
                All data shown is sample data for
                demonstration purposes only
              </p>
            </div>
          </div>

          <div
            className="
              shrink-0
              px-4
              py-1.5
              rounded-full
              bg-white/15
              text-xs
              font-semibold
              backdrop-blur
              ring-1
              ring-white/20
            "
          >
            No data is modified
          </div>
        </div>
      </div>
    </div>
  );
}