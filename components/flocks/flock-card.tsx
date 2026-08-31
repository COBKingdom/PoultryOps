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

function safeNumber(value: unknown): number {
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

function formatBirds(value: unknown): string {
  return safeNumber(value).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

export default function FlockCard({
  flock,
  onView,
  onEdit,
}: Props) {
  const router = useRouter();

  const [showActions, setShowActions] =
    useState(false);

  const formatDate = (
    dateString: string
  ) => {
    if (!dateString) return "Not Set";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
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

  const handleViewClick = () => {
    if (onView) {
      onView(flock);
      return;
    }

    router.push(
      `/flocks/${flock.id}`
    );
  };

  const handleEditClick = () => {
    onEdit(flock);
    setShowActions(false);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {displayValue(
              flock.flock_name
            )}
          </h3>

          {flock.batch_number && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 mb-2">
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
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Actions menu"
          >
            <MoreVertical size={18} />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() =>
                  setShowActions(false)
                }
              />

              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-2">
                <button
                  onClick={() => {
                    handleViewClick();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Eye size={16} />
                  View Details
                </button>

                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
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

        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Calendar size={14} />

            <p className="text-xs font-medium">
              Age
            </p>
          </div>

          <p className="text-base font-bold text-slate-900">
            {safeNumber(
              flock.age_weeks
            ) > 0
              ? `${safeNumber(
                  flock.age_weeks
                )} ${
                  safeNumber(
                    flock.age_weeks
                  ) === 1
                    ? "week"
                    : "weeks"
                }`
              : "Not Recorded"}
          </p>
        </div>

        {flock.house && (
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <MapPin size={14} />

              <p className="text-xs font-medium">
                House
              </p>
            </div>

            <p className="text-base font-bold text-slate-900 truncate">
              {flock.house}
            </p>
          </div>
        )}

        {flock.pen && (
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <MapPin size={14} />

              <p className="text-xs font-medium">
                Pen
              </p>
            </div>

            <p className="text-base font-bold text-slate-900 truncate">
              {flock.pen}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
        <div className="text-xs text-slate-500">
          Registered{" "}
          {formatDate(
            flock.created_at
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            aria-label="View flock details"
          >
            <Eye size={14} />
            View
          </button>

          <button
            onClick={() =>
              onEdit(flock)
            }
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
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