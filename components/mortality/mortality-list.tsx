"use client";

import { useState } from "react";
import {
  Pencil,
  MoreVertical,
  User,
  Calendar,
  Clock,
  FileText,
  X,
} from "lucide-react";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
};

function formatRecordedAt(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRecorderName(record: any) {
  /*
   * We support several possible profile shapes so the
   * component remains compatible with the existing
   * mortality query while the detailed attribution
   * data is introduced.
   */
  const profile =
    record.created_by_profile ||
    record.profiles ||
    record.createdByProfile;

  if (profile) {
    const name =
      profile.full_name ||
      profile.name ||
      [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ");

    if (name) return name;

    if (profile.email) return profile.email;
  }

  return record.created_by
    ? "Farm team member"
    : "Not recorded";
}

export default function MortalityList({
  records,
  onEdit,
}: Props) {
  const [selectedRecord, setSelectedRecord] =
    useState<any | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Mortality Records
          </h2>

          <p className="text-slate-500 mt-1">
            Detailed mortality history
          </p>
        </div>

        <div className="py-12 text-center">
          <p className="text-slate-500">
            No mortality records found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Mortality Records
          </h2>

          <p className="text-slate-500 mt-1">
            Detailed mortality history
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
                  border
                  border-slate-200
                  rounded-3xl
                  p-5
                  hover:shadow-md
                  transition-all
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xl text-slate-900">
                      {record.flocks?.flock_name ||
                        "Unknown Flock"}
                    </h3>

                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                      <Calendar size={15} />

                      <span>
                        Mortality date:{" "}
                        {record.mortality_date ||
                          "Not recorded"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="
                        px-4
                        py-2
                        rounded-2xl
                        bg-red-100
                        text-red-700
                        font-bold
                      "
                    >
                      {Number(
                        record.quantity || 0
                      ).toLocaleString()}
                      {" "}
                      birds
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === record.id
                              ? null
                              : record.id
                          )
                        }
                        className="
                          p-2
                          rounded-xl
                          border
                          border-slate-200
                          text-slate-500
                          hover:bg-slate-100
                          hover:text-slate-900
                          transition
                        "
                        aria-label="Mortality actions"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuId === record.id && (
                        <div
                          className="
                            absolute
                            right-0
                            top-11
                            z-20
                            w-44
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            shadow-xl
                            p-2
                          "
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(
                                record
                              );
                              setOpenMenuId(null);
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              rounded-xl
                              text-sm
                              font-medium
                              text-slate-700
                              hover:bg-slate-100
                              text-left
                            "
                          >
                            <FileText size={16} />
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onEdit(record);
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              rounded-xl
                              text-sm
                              font-medium
                              text-slate-700
                              hover:bg-slate-100
                              text-left
                            "
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Cause
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {record.reason ||
                        "Not specified"}
                    </p>
                  </div>

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

                  <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
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

      {selectedRecord && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/50
            flex
            items-center
            justify-center
            p-4
          "
          onClick={() =>
            setSelectedRecord(null)
          }
        >
          <div
            className="
              bg-white
              rounded-3xl
              max-w-lg
              w-full
              max-h-[90vh]
              overflow-y-auto
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Mortality Details
                  </h2>

                  <p className="text-slate-500 mt-1">
                    {selectedRecord.flocks
                      ?.flock_name ||
                      "Unknown Flock"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecord(null)
                  }
                  className="
                    p-2
                    rounded-xl
                    text-slate-500
                    hover:bg-slate-100
                    hover:text-slate-900
                  "
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Mortality Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedRecord.mortality_date ||
                      "Not recorded"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Birds Lost
                  </p>

                  <p className="mt-1 font-semibold text-red-700">
                    {Number(
                      selectedRecord.quantity || 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Cause
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedRecord.reason ||
                      "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Recorded By
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {getRecorderName(
                      selectedRecord
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Recorded At
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatRecordedAt(
                      selectedRecord.created_at
                    )}
                  </p>
                </div>

                {selectedRecord.updated_at && (
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-500">
                      Last Updated
                    </p>

                    <p className="mt-1 font-semibold text-blue-900">
                      {formatRecordedAt(
                        selectedRecord.updated_at
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecord(null)
                  }
                  className="
                    rounded-xl
                    bg-slate-900
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-slate-800
                  "
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}