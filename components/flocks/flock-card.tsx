"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Eye,
  Edit,
  MoreVertical,
  Package,
  Calendar,
  MapPin,
} from "lucide-react";

type Props = {
  flock: any;
  onView?: (flock: any) => void;
  onEdit: (flock: any) => void;
};

function safeNumber(
  value: unknown
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const parsed = Number(
    String(value)
      .replace(/,/g, "")
      .trim()
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatBirds(
  value: unknown
): string {
  return safeNumber(
    value
  ).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function getCurrentAgeDays(
  flock: any
): number | null {
  if (
    flock?.age_weeks === null ||
    flock?.age_weeks === undefined ||
    flock?.age_weeks === ""
  ) {
    return null;
  }

  const startingAgeWeeks =
    Number(flock.age_weeks);

  if (
    !Number.isFinite(
      startingAgeWeeks
    ) ||
    startingAgeWeeks < 0
  ) {
    return null;
  }

  const startDateValue =
    flock.arrival_date ||
    flock.created_at;

  if (!startDateValue) {
    return Math.round(
      startingAgeWeeks * 7
    );
  }

  const startDate =
    new Date(startDateValue);

  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    return Math.round(
      startingAgeWeeks * 7
    );
  }

  const now = new Date();

  const elapsedMilliseconds =
    now.getTime() -
    startDate.getTime();

  const elapsedDays = Math.max(
    0,
    Math.floor(
      elapsedMilliseconds /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    Math.round(
      startingAgeWeeks * 7
    ) +
    elapsedDays
  );
}

function formatAgeAtStart(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  const weeks =
    Number(value);

  if (
    !Number.isFinite(weeks) ||
    weeks < 0
  ) {
    return "Not recorded";
  }

  const totalDays =
    Math.round(weeks * 7);

  const wholeWeeks =
    Math.floor(totalDays / 7);

  const days =
    totalDays % 7;

  if (days === 0) {
    return `${wholeWeeks} ${
      wholeWeeks === 1
        ? "week"
        : "weeks"
    }`;
  }

  if (wholeWeeks === 0) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    }`;
  }

  return `${wholeWeeks}w ${days}d`;
}

function formatCurrentAge(
  flock: any
): string {
  const totalDays =
    getCurrentAgeDays(flock);

  if (
    totalDays === null ||
    !Number.isFinite(totalDays)
  ) {
    return "Not recorded";
  }

  const weeks =
    Math.floor(totalDays / 7);

  const days =
    totalDays % 7;

  if (days === 0) {
    return `${weeks} ${
      weeks === 1
        ? "week"
        : "weeks"
    }`;
  }

  if (weeks === 0) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    }`;
  }

  return `${weeks}w ${days}d`;
}

export default function FlockCard({
  flock,
  onView,
  onEdit,
}: Props) {
  const router = useRouter();

  const [
    showActions,
    setShowActions,
  ] = useState(false);

  const formatDate = (
    dateString: string
  ) => {
    if (!dateString) {
      return "Not Set";
    }

    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not Set";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getBirdTypeColor = (
    type: string
  ) => {
    const colors: Record<
      string,
      string
    > = {
      Layers:
        "bg-blue-100 text-blue-700",
      Broilers:
        "bg-green-100 text-green-700",
      Growers:
        "bg-yellow-100 text-yellow-700",
      Cockerels:
        "bg-purple-100 text-purple-700",
    };

    return (
      colors[type] ||
      "bg-slate-100 text-slate-700"
    );
  };

  const getStatusColor = (
    status: string
  ) => {
    const colors: Record<
      string,
      string
    > = {
      Active:
        "bg-green-100 text-green-700",
      Draft:
        "bg-amber-100 text-amber-700",
      Completed:
        "bg-blue-100 text-blue-700",
    };

    return (
      colors[status] ||
      "bg-slate-100 text-slate-600"
    );
  };

  const displayValue = (
    value: any,
    fallback = "Not Set"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  };

  const handleViewClick =
    () => {
      if (onView) {
        onView(flock);
        return;
      }

      router.push(
        `/flocks/${flock.id}`
      );
    };

  const handleEditClick =
    () => {
      onEdit(flock);
      setShowActions(false);
    };

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {displayValue(
              flock.flock_name
            )}
          </h3>

          {flock.batch_number && (
            <p className="mt-1 mb-2 flex items-center gap-1 text-sm text-slate-500">
              <span className="font-medium">
                Batch:
              </span>

              {flock.batch_number}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBirdTypeColor(
                flock.bird_type
              )}`}
            >
              {displayValue(
                flock.bird_type
              )}
            </span>

            {flock.breed && (
              <span className="text-xs text-slate-600">
                <span className="font-medium">
                  Breed:
                </span>{" "}
                {flock.breed}
              </span>
            )}

            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                flock.status ||
                  "Active"
              )}`}
            >
              {flock.status ||
                "Active"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="relative ml-2">
          <button
            onClick={() =>
              setShowActions(
                !showActions
              )
            }
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Actions menu"
          >
            <MoreVertical
              size={18}
            />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() =>
                  setShowActions(false)
                }
              />

              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                <button
                  onClick={() => {
                    handleViewClick();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Eye size={16} />
                  View Details
                </button>

                <button
                  onClick={
                    handleEditClick
                  }
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Operational KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <Package size={14} />

            <p className="text-xs font-medium">
              Birds
            </p>
          </div>

          <p className="text-base font-bold text-slate-900">
            {formatBirds(
              flock.quantity
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <Calendar size={14} />

            <p className="text-xs font-medium">
              Age at Start
            </p>
          </div>

          <p className="text-base font-bold text-slate-900">
            {formatAgeAtStart(
              flock.age_weeks
            )}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-blue-600">
            <Calendar size={14} />

            <p className="text-xs font-medium">
              Current Age
            </p>
          </div>

          <p className="text-base font-bold text-blue-900">
            {formatCurrentAge(
              flock
            )}
          </p>
        </div>

        {flock.house && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-slate-500">
              <MapPin size={14} />

              <p className="text-xs font-medium">
                House
              </p>
            </div>

            <p className="truncate text-base font-bold text-slate-900">
              {flock.house}
            </p>
          </div>
        )}

        {flock.pen && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-slate-500">
              <MapPin size={14} />

              <p className="text-xs font-medium">
                Pen
              </p>
            </div>

            <p className="truncate text-base font-bold text-slate-900">
              {flock.pen}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          Registered{" "}
          {formatDate(
            flock.created_at
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={
              handleViewClick
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            aria-label="View flock details"
          >
            <Eye size={14} />
            View
          </button>

          <button
            onClick={() =>
              onEdit(flock)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            aria-label="Edit flock"
          >
            <Edit size={14} />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}