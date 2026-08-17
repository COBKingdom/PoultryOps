"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

import {
  DateRangePreset,
  DateRangeSelection,
  getDateRange,
  getPresetLabel,
  formatDateRange,
} from "@/lib/date-ranges";

type Props = {
  value: DateRangeSelection;
  onChange: (selection: DateRangeSelection) => void;
};

const PRESETS: DateRangePreset[] = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "any_day",
  "custom",
];

export default function ReportFilter({
  value,
  onChange,
}: Props) {
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const [customStart, setCustomStart] =
    useState(
      value.preset === "custom"
        ? value.range.start
        : ""
    );

  const [customEnd, setCustomEnd] =
    useState(
      value.preset === "custom"
        ? value.range.end
        : ""
    );

  const [selectedDay, setSelectedDay] =
    useState(
      value.preset === "any_day"
        ? value.range.start
        : ""
    );

  function getTodayString() {
    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function selectPreset(
    preset: DateRangePreset
  ) {
    if (preset === "any_day") {
      const day =
        selectedDay ||
        value.range.start ||
        getTodayString();

      setSelectedDay(day);

      onChange({
        preset: "any_day",
        range: getDateRange(
          "any_day",
          day
        ),
      });

      setDropdownOpen(false);
      return;
    }

    if (preset === "custom") {
      const start =
        customStart ||
        value.range.start;

      const end =
        customEnd ||
        value.range.end;

      onChange({
        preset: "custom",
        range: getDateRange(
          "custom",
          start,
          end
        ),
      });

      setDropdownOpen(false);
      return;
    }

    onChange({
      preset,
      range: getDateRange(
        preset
      ),
    });

    setDropdownOpen(false);
  }

  function applySelectedDay() {
    if (!selectedDay) {
      return;
    }

    const today =
      getTodayString();

    if (selectedDay > today) {
      alert(
        "Please select a date in the past."
      );
      return;
    }

    onChange({
      preset: "any_day",
      range: getDateRange(
        "any_day",
        selectedDay
      ),
    });

    setDropdownOpen(false);
  }

  function applyCustomRange() {
    if (
      !customStart ||
      !customEnd
    ) {
      return;
    }

    const today =
      getTodayString();

    if (
      customStart > today ||
      customEnd > today
    ) {
      alert(
        "Please select dates that are today or in the past."
      );
      return;
    }

    if (customStart > customEnd) {
      alert(
        "Start Date cannot be after End Date."
      );
      return;
    }

    onChange({
      preset: "custom",
      range: getDateRange(
        "custom",
        customStart,
        customEnd
      ),
    });

    setDropdownOpen(false);
  }

  return (
    <div className="relative">

      {/* Trigger button */}
      <button
        type="button"
        onClick={() =>
          setDropdownOpen(
            !dropdownOpen
          )
        }
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-2.5
          text-sm
          font-medium
          text-slate-700
          shadow-sm
          hover:bg-slate-50
          transition-colors
        "
      >
        <Calendar
          size={16}
          className="text-slate-500"
        />

        <span>
          {getPresetLabel(
            value.preset
          )}
        </span>

        {value.preset ===
          "any_day" && (
          <span className="text-slate-400 text-xs">
            (
            {formatDateRange(
              value.range
            )}
            )
          </span>
        )}

        {value.preset ===
          "custom" && (
          <span className="text-slate-400 text-xs">
            (
            {formatDateRange(
              value.range
            )}
            )
          </span>
        )}

        <ChevronDown
          size={16}
          className={`
            text-slate-400
            transition-transform
            ${
              dropdownOpen
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="
              fixed
              inset-0
              z-40
            "
            onClick={() =>
              setDropdownOpen(false)
            }
          />

          {/* Panel */}
          <div
            className="
              absolute
              right-0
              mt-2
              w-72
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-lg
              z-50
              overflow-hidden
            "
          >

            {/* Preset list */}
            <div className="p-2">

              {PRESETS.map(
                (preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() =>
                      selectPreset(
                        preset
                      )
                    }
                    className={`
                      w-full
                      text-left
                      px-3
                      py-2.5
                      rounded-lg
                      text-sm
                      font-medium
                      transition-colors
                      ${
                        value.preset ===
                        preset
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {getPresetLabel(
                      preset
                    )}
                  </button>
                )
              )}

            </div>

            {/* Any Day */}
            {value.preset ===
              "any_day" && (
              <div
                className="
                  border-t
                  border-slate-100
                  p-3
                  space-y-3
                "
              >
                <div>

                  <label
                    className="
                      block
                      text-xs
                      font-medium
                      text-slate-500
                      mb-1
                    "
                  >
                    Select Date
                  </label>

                  <input
                    type="date"
                    value={
                      selectedDay
                    }
                    max={getTodayString()}
                    onChange={(e) =>
                      setSelectedDay(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      py-2
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      focus:border-transparent
                    "
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    applySelectedDay
                  }
                  disabled={
                    !selectedDay
                  }
                  className="
                    w-full
                    rounded-lg
                    bg-blue-600
                    px-3
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-blue-700
                    transition-colors
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Apply Date
                </button>

              </div>
            )}

            {/* Custom date range */}
            {value.preset ===
              "custom" && (
              <div
                className="
                  border-t
                  border-slate-100
                  p-3
                  space-y-3
                "
              >

                <div>

                  <label
                    className="
                      block
                      text-xs
                      font-medium
                      text-slate-500
                      mb-1
                    "
                  >
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      customStart
                    }
                    max={getTodayString()}
                    onChange={(e) =>
                      setCustomStart(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      py-2
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      focus:border-transparent
                    "
                  />

                </div>

                <div>

                  <label
                    className="
                      block
                      text-xs
                      font-medium
                      text-slate-500
                      mb-1
                    "
                  >
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      customEnd
                    }
                    max={getTodayString()}
                    onChange={(e) =>
                      setCustomEnd(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      py-2
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      focus:border-transparent
                    "
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    applyCustomRange
                  }
                  disabled={
                    !customStart ||
                    !customEnd
                  }
                  className="
                    w-full
                    rounded-lg
                    bg-blue-600
                    px-3
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-blue-700
                    transition-colors
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Apply Range
                </button>

              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}