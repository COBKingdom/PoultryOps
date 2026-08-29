"use client";

import {
  Egg,
  Pencil,
  User,
  Calendar,
  Clock,
} from "lucide-react";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
};

function formatRecordedAt(
  value: string | null | undefined
) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

/**
 * Resolve the person who created the
 * egg production record.
 *
 * Preferred:
 * 1. Full name from related profile
 * 2. Email from related profile
 * 3. Generic farm team member fallback
 * 4. Not recorded for legacy records
 */
function getRecorderName(
  record: any
) {
  const profile =
    record.created_by_profile ||
    record.profiles ||
    record.createdByProfile;

  if (profile) {
    const name =
      profile.full_name ||
      profile.name ||
      [
        profile.first_name,
        profile.last_name,
      ]
        .filter(Boolean)
        .join(" ");

    if (name?.trim()) {
      return name.trim();
    }

    if (profile.email) {
      return profile.email;
    }
  }

  return record.created_by
    ? "Farm team member"
    : "Not recorded";
}

export default function EggProductionList({
  records,
  onEdit,
}: Props) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Production Records
          </h2>

          <p className="text-slate-500 mt-1">
            Recent egg collection activity
          </p>
        </div>

        <div className="py-12 text-center">
          <p className="text-slate-500">
            No egg production records found.
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Production Records
        </h2>

        <p className="text-slate-500 mt-1">
          Recent egg collection activity
        </p>
      </div>

      <div className="space-y-4">

        {records.map((record) => {
          const recorder =
            getRecorderName(record);

          return (
            <div
              key={record.id}
              className="
                rounded-2xl
                border
                border-slate-200
                p-5
                hover:shadow-md
                transition-all
              "
            >

              {/* Header */}
              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <h3 className="font-bold text-xl text-slate-900">
                    {record.flocks?.flock_name ||
                      "Unknown Flock"}
                  </h3>

                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                    <Calendar size={15} />

                    <span>
                      Production date:{" "}
                      {record.production_date ||
                        "Not recorded"}
                    </span>
                  </div>

                </div>

                <div className="flex items-center gap-3 flex-shrink-0">

                  <div
                    className="
                      w-12
                      h-12
                      rounded-2xl
                      bg-amber-100
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Egg
                      size={24}
                      className="text-amber-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(record)
                    }
                    className="
                      rounded-xl
                      border
                      border-blue-200
                      bg-blue-50
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-blue-700
                      transition
                      hover:bg-blue-100
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                </div>

              </div>

              {/* Production values */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Eggs Collected
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {Number(
                      record.egg_count || 0
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Cracked Eggs
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {Number(
                      record.cracked_eggs || 0
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                </div>

                {/* Recorded By */}
                <div className="rounded-2xl bg-slate-50 p-4">

                  <div className="flex items-center gap-2">

                    <User
                      size={14}
                      className="text-slate-400"
                    />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Recorded By
                    </p>

                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {recorder}
                  </p>

                </div>

                {/* Recorded At */}
                <div className="rounded-2xl bg-slate-50 p-4">

                  <div className="flex items-center gap-2">

                    <Clock
                      size={14}
                      className="text-slate-400"
                    />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Recorded At
                    </p>

                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatRecordedAt(
                      record.created_at
                    )}
                  </p>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}