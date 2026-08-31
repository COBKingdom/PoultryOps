"use client";

import {
  Activity,
  Calendar,
  FileText,
  MapPin,
  Package,
  Truck,
  User,
  X,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  flock: any;
};

function formatDate(dateString?: string | null) {
  if (!dateString) return "Not recorded";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatNumber(value: unknown) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
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

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon size={15} />}

        <p className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function FlockViewModal({
  isOpen,
  onClose,
  flock,
}: Props) {
  if (!isOpen || !flock) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {flock.flock_name}
              </h2>

              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {flock.status || "Active"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Flock operational summary
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close flock details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoCard
                label="Birds"
                value={formatNumber(flock.quantity)}
                icon={Package}
              />

              <InfoCard
                label="Age"
                value={formatAge(flock.age_weeks)}
                icon={Calendar}
              />

              <InfoCard
                label="Bird Type"
                value={flock.bird_type || "Not recorded"}
                icon={Activity}
              />

              <InfoCard
                label="Arrival"
                value={formatDate(flock.arrival_date)}
                icon={Truck}
              />
            </div>

            {/* General Information */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                General Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoCard
                  label="Batch Number"
                  value={
                    flock.batch_number || "Not recorded"
                  }
                  icon={Package}
                />

                <InfoCard
                  label="Breed"
                  value={flock.breed || "Not recorded"}
                  icon={Activity}
                />

                <InfoCard
                  label="Supplier"
                  value={flock.supplier || "Not recorded"}
                  icon={User}
                />

                <InfoCard
                  label="House"
                  value={flock.house || "Not recorded"}
                  icon={MapPin}
                />

                <InfoCard
                  label="Pen"
                  value={flock.pen || "Not recorded"}
                  icon={MapPin}
                />

                <InfoCard
                  label="Registered"
                  value={formatDate(flock.created_at)}
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FileText
                  size={19}
                  className="text-slate-600"
                />

                <h3 className="text-lg font-bold text-slate-900">
                  Notes
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                {flock.notes ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {flock.notes}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    No notes recorded for this flock.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}