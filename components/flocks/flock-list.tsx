"use client";

import {
  Archive,
  Calendar,
  Edit,
  Eye,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  loading: boolean;
  flocks: any[];
  onEdit: (flock: any) => void;
  onArchive: (id: string) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatAge(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  const totalDays = Math.round(Number(value) * 7);

  if (!Number.isFinite(totalDays)) {
    return "Not recorded";
  }

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (days === 0) {
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }

  return `${weeks}w ${days}d`;
}

export default function FlockList({
  loading,
  flocks,
  onEdit,
  onArchive,
}: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-center text-sm text-slate-500">
          Loading flocks...
        </p>
      </div>
    );
  }

  if (flocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Package size={30} className="text-blue-600" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          No Flocks Yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Register your first flock to begin managing
          birds and tracking farm operations.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          Current Flocks
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {flocks.length} flock
          {flocks.length === 1 ? "" : "s"} registered
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {flocks.map((flock) => (
          <div
            key={flock.id}
            className="p-6 transition hover:bg-slate-50"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {flock.flock_name}
                  </h3>

                  <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {flock.status || "Active"}
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {flock.bird_type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Package size={15} />
                    {formatNumber(flock.quantity)} birds
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={15} />
                    {formatAge(flock.age_weeks)}
                  </span>

                  {flock.house && (
                    <span>
                      House: {flock.house}
                    </span>
                  )}

                  {flock.pen && (
                    <span>
                      Pen: {flock.pen}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Registered {formatDate(flock.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    router.push(`/flocks/${flock.id}`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Eye size={15} />
                  View
                </button>

                <button
                  onClick={() => onEdit(flock)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <Edit size={15} />
                  Edit
                </button>

                <button
                  onClick={() => onArchive(flock.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                >
                  <Archive size={15} />
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}