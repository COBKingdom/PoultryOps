"use client";

import {
  Activity,
  ArrowDownToLine,
  Bird,
  CalendarDays,
  Skull,
} from "lucide-react";

import {
  format,
} from "date-fns";

type Props = {
  records: any[];
  onRecover?: (
    record: any
  ) => void;
  onDeath?: (
    record: any
  ) => void;
};

function getRemaining(
  record: any
) {
  return Math.max(
    0,
    Number(record.quantity || 0) -
      Number(
        record.returned_quantity || 0
      ) -
      Number(
        record.deceased_quantity || 0
      )
  );
}

function getStatusStyles(
  status: string
) {
  switch (status) {
    case "recovered":
      return {
        label: "Recovered",
        className:
          "bg-green-100 text-green-700",
      };

    case "deceased":
      return {
        label: "Deceased",
        className:
          "bg-red-100 text-red-700",
      };

    case "transferred":
      return {
        label: "Completed",
        className:
          "bg-purple-100 text-purple-700",
      };

    default:
      return {
        label: "Active",
        className:
          "bg-amber-100 text-amber-700",
      };
  }
}

export default function IsolationList({
  records,
  onRecover,
  onDeath,
}: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Activity
            className="text-amber-600"
            size={40}
          />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          No Isolation Records
        </h2>

        <p className="text-slate-500 max-w-md mx-auto">
          Sick or vulnerable birds moved into
          isolation will appear here. Each record
          remains linked to its original flock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map(
        (record) => {
          const remaining =
            getRemaining(record);

          const status =
            getStatusStyles(
              record.status
            );

          const flockName =
            record.flocks
              ?.flock_name ||
            "Unknown Flock";

          let formattedDate =
            record.isolation_date;

          try {
            if (
              record.isolation_date
            ) {
              formattedDate =
                format(
                  new Date(
                    `${record.isolation_date}T00:00:00`
                  ),
                  "dd MMM yyyy"
                );
            }
          } catch {
            // Keep original date.
          }

          return (
            <div
              key={record.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                    <Bird
                      className="text-amber-600"
                      size={24}
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {flockName}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          size={14}
                        />
                        {formattedDate}
                      </span>

                      {record.flocks
                        ?.bird_type && (
                        <span>
                          {
                            record.flocks
                              .bird_type
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {record.status ===
                  "active" &&
                  remaining > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onRecover?.(
                            record
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <ArrowDownToLine
                          size={16}
                        />
                        Return Birds
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDeath?.(
                            record
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Skull
                          size={16}
                        />
                        Record Death
                      </button>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Isolated
                  </p>

                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {Number(
                      record.quantity || 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Remaining
                  </p>

                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {remaining.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Returned
                  </p>

                  <p className="text-xl font-bold text-green-600 mt-1">
                    {Number(
                      record.returned_quantity ||
                        0
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Deceased
                  </p>

                  <p className="text-xl font-bold text-red-600 mt-1">
                    {Number(
                      record.deceased_quantity ||
                        0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-600">
                    Reason
                  </span>

                  <span className="text-sm font-semibold text-slate-900 text-right">
                    {record.reason}
                  </span>
                </div>
              </div>

              {record.notes && (
                <div className="mt-4 text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Notes:
                  </span>{" "}
                  {record.notes}
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}