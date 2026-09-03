"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ComponentType } from "react";

import {
  Activity,
  Archive,
  ArrowLeft,
  Calendar,
  Egg,
  Edit,
  FileText,
  HeartPulse,
  Package,
  ReceiptText,
  ShoppingCart,
  Skull,
  Truck,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";

import AppShell from "@/components/layout/app-shell";

import {
  archiveFlock,
  getFlockAvailableBirds,
  getFlockById,
} from "@/lib/flocks";

import { supabase } from "@/lib/supabase";

type TabId =
  | "overview"
  | "production"
  | "feed"
  | "health"
  | "mortality"
  | "sales"
  | "expenses"
  | "reports"
  | "activity";

type Tab = {
  id: TabId;
  label: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
};

type OperationalData = {
  eggs: any[];
  feed: any[];
  health: any[];
  mortality: any[];
  sales: any[];
  expenses: any[];
};

const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "production", label: "Production", icon: Egg },
  { id: "feed", label: "Feed", icon: Package },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "mortality", label: "Mortality", icon: Skull },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "expenses", label: "Expenses", icon: ReceiptText },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
];

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

function formatLongDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

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

function formatCurrency(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatAgeAtStart(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  const weeks = Number(value);

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

function formatCurrentAge(
  flock: any
) {
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

function statusClasses(status?: string) {
  switch (status) {
    case "Draft":
      return "bg-amber-100 text-amber-700 border-amber-200";

    case "Completed":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "Archived":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

function birdTypeClasses(type?: string) {
  switch (type) {
    case "Layers":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "Broilers":
      return "bg-green-100 text-green-700 border-green-200";

    case "Growers":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    case "Cockerels":
      return "bg-purple-100 text-purple-700 border-purple-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function KpiCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-bold text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Icon size={24} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-base font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  href?: string;
  actionLabel?: string;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
        <Icon size={26} className="text-blue-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {description}
      </p>

      {href && actionLabel && (
        <button
          onClick={() => router.push(href)}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function RecordTable({
  columns,
  rows,
}: {
  columns: {
    label: string;
    render: (row: any) => React.ReactNode;
  }[];
  rows: any[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, index) => (
              <tr
                key={row.id || `${index}`}
                className="transition hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.label}
                    className="whitespace-nowrap px-5 py-4 text-sm text-slate-700"
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductionTab({
  records,
  flock,
}: {
  records: any[];
  flock: any;
}) {
  const totalEggs = records.reduce(
    (sum, record) =>
      sum + Number(record.egg_count || 0),
    0
  );

  const crackedEggs = records.reduce(
    (sum, record) =>
      sum + Number(record.cracked_eggs || 0),
    0
  );

  const goodEggs = Math.max(
    0,
    totalEggs - crackedEggs
  );

  const averagePerDay =
    records.length > 0
      ? totalEggs / records.length
      : 0;

  const productionRate =
    Number(flock.quantity || 0) > 0
      ? (averagePerDay / Number(flock.quantity)) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Egg Production
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Actual egg production records recorded against this flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Eggs"
          value={formatNumber(totalEggs)}
          icon={Egg}
          description="Recorded production"
        />

        <KpiCard
          title="Good Eggs"
          value={formatNumber(goodEggs)}
          icon={Egg}
          description="After cracked eggs"
        />

        <KpiCard
          title="Cracked"
          value={formatNumber(crackedEggs)}
          icon={Egg}
        />

        <KpiCard
          title="Avg / Day"
          value={formatNumber(averagePerDay)}
          icon={Activity}
          description={`${productionRate.toFixed(1)}% of flock`}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Production Records"
          description={`No egg production has been recorded for ${flock.flock_name} yet.`}
          icon={Egg}
          href="/eggs"
          actionLabel="Go to Egg Production"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.production_date),
            },
            {
              label: "Eggs",
              render: (row) => (
                <span className="font-bold text-slate-900">
                  {formatNumber(row.egg_count)}
                </span>
              ),
            },
            {
              label: "Cracked",
              render: (row) =>
                formatNumber(row.cracked_eggs),
            },
            {
              label: "Good Eggs",
              render: (row) =>
                formatNumber(
                  Math.max(
                    0,
                    Number(row.egg_count || 0) -
                      Number(row.cracked_eggs || 0)
                  )
                ),
            },
          ]}
        />
      )}
    </div>
  );
}

function FeedTab({
  records,
  flock,
}: {
  records: any[];
  flock: any;
}) {
  const totalFeed = records.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg || 0),
    0
  );

  const averageDaily =
    records.length > 0
      ? totalFeed / records.length
      : 0;

  const feedPerBird =
    Number(flock.quantity || 0) > 0
      ? totalFeed / Number(flock.quantity)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Feed Consumption
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Actual feed records recorded against this flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Feed"
          value={`${formatNumber(totalFeed)} kg`}
          icon={Package}
          description="Recorded consumption"
        />

        <KpiCard
          title="Avg / Record"
          value={`${formatNumber(averageDaily)} kg`}
          icon={Activity}
        />

        <KpiCard
          title="Per Starting Bird"
          value={`${feedPerBird.toFixed(2)} kg`}
          icon={Package}
        />

        <KpiCard
          title="Records"
          value={formatNumber(records.length)}
          icon={Calendar}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Feed Records"
          description={`No feed consumption has been recorded for ${flock.flock_name} yet.`}
          icon={Package}
          href="/feed"
          actionLabel="Go to Feed"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.feed_date),
            },
            {
              label: "Feed Type",
              render: (row) => (
                <span className="font-semibold text-slate-900">
                  {row.feed_type || "Not recorded"}
                </span>
              ),
            },
            {
              label: "Quantity",
              render: (row) => (
                <span className="font-bold text-slate-900">
                  {formatNumber(row.quantity_kg)} kg
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

function HealthTab({
  records,
  flock,
  currency,
}: {
  records: any[];
  flock: any;
  currency?: string;
}) {
  const totalCost = records.reduce(
    (sum, record) =>
      sum + Number(record.cost || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Health & Treatment
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Health and treatment records associated with this flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          title="Health Records"
          value={formatNumber(records.length)}
          icon={HeartPulse}
        />

        <KpiCard
          title="Treatment Cost"
          value={formatCurrency(totalCost, currency)}
          icon={Wallet}
        />

        <KpiCard
          title="Latest Record"
          value={
            records.length > 0
              ? formatDate(records[0].health_date)
              : "None"
          }
          icon={Calendar}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Health Records"
          description={`No health or treatment records have been recorded for ${flock.flock_name} yet.`}
          icon={HeartPulse}
          href="/health"
          actionLabel="Go to Health"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.health_date),
            },
            {
              label: "Treatment",
              render: (row) => (
                <span className="font-semibold text-slate-900">
                  {row.treatment_name || "Not recorded"}
                </span>
              ),
            },
            {
              label: "Category",
              render: (row) =>
                row.category || "Not recorded",
            },
            {
              label: "Cost",
              render: (row) =>
                formatCurrency(row.cost, currency),
            },
            {
              label: "Notes",
              render: (row) => (
                <span className="max-w-xs truncate">
                  {row.notes || "—"}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

function MortalityTab({
  records,
  flock,
}: {
  records: any[];
  flock: any;
}) {
  const totalMortality = records.reduce(
    (sum, record) =>
      sum + Number(record.quantity || 0),
    0
  );

  const mortalityRate =
    Number(flock.quantity || 0) > 0
      ? (totalMortality / Number(flock.quantity)) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Mortality
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Mortality records associated with this flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          title="Birds Lost"
          value={formatNumber(totalMortality)}
          icon={Skull}
        />

        <KpiCard
          title="Mortality Rate"
          value={`${mortalityRate.toFixed(2)}%`}
          icon={HeartPulse}
        />

        <KpiCard
          title="Records"
          value={formatNumber(records.length)}
          icon={Calendar}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Mortality Records"
          description={`No mortality has been recorded for ${flock.flock_name} yet.`}
          icon={Skull}
          href="/mortality"
          actionLabel="Go to Mortality"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.mortality_date),
            },
            {
              label: "Quantity",
              render: (row) => (
                <span className="font-bold text-red-600">
                  {formatNumber(row.quantity)}
                </span>
              ),
            },
            {
              label: "Reason",
              render: (row) =>
                row.reason || "Not recorded",
            },
          ]}
        />
      )}
    </div>
  );
}

function SalesTab({
  records,
  flock,
  currency,
}: {
  records: any[];
  flock: any;
  currency?: string;
}) {
  const totalQuantity = records.reduce(
    (sum, record) =>
      sum + Number(record.quantity || 0),
    0
  );

  const totalRevenue = records.reduce(
    (sum, record) =>
      sum + Number(record.total_amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Sales
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Sales records linked to this flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          title="Sales Quantity"
          value={formatNumber(totalQuantity)}
          icon={ShoppingCart}
        />

        <KpiCard
          title="Revenue"
          value={formatCurrency(totalRevenue, currency)}
          icon={Wallet}
        />

        <KpiCard
          title="Transactions"
          value={formatNumber(records.length)}
          icon={Calendar}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Sales Records"
          description={`No sales have been linked to ${flock.flock_name} yet.`}
          icon={ShoppingCart}
          href="/sales"
          actionLabel="Go to Sales"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.sale_date),
            },
            {
              label: "Item",
              render: (row) => (
                <span className="font-semibold text-slate-900">
                  {row.item_type || "Not recorded"}
                </span>
              ),
            },
            {
              label: "Quantity",
              render: (row) =>
                formatNumber(row.quantity),
            },
            {
              label: "Unit Price",
              render: (row) =>
                formatCurrency(row.unit_price, currency),
            },
            {
              label: "Total",
              render: (row) => (
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    row.total_amount,
                    currency
                  )}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

function ExpensesTab({
  records,
  currency,
}: {
  records: any[];
  currency?: string;
}) {
  const totalExpenses = records.reduce(
    (sum, record) =>
      sum + Number(record.amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Farm Expenses
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Expenses are currently stored at farm level in PoultryOps,
          so these figures represent the farm rather than this individual flock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          title="Farm Expenses"
          value={formatCurrency(
            totalExpenses,
            currency
          )}
          icon={ReceiptText}
        />

        <KpiCard
          title="Expense Records"
          value={formatNumber(records.length)}
          icon={Calendar}
        />

        <KpiCard
          title="Average"
          value={formatCurrency(
            records.length > 0
              ? totalExpenses / records.length
              : 0,
            currency
          )}
          icon={Wallet}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No Farm Expenses"
          description="No expenses have been recorded for this farm yet."
          icon={ReceiptText}
          href="/expenses"
          actionLabel="Go to Expenses"
        />
      ) : (
        <RecordTable
          rows={records}
          columns={[
            {
              label: "Date",
              render: (row) =>
                formatDate(row.expense_date),
            },
            {
              label: "Category",
              render: (row) => (
                <span className="font-semibold text-slate-900">
                  {row.category || "Not recorded"}
                </span>
              ),
            },
            {
              label: "Amount",
              render: (row) => (
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    row.amount,
                    currency
                  )}
                </span>
              ),
            },
            {
              label: "Notes",
              render: (row) => row.notes || "—",
            },
          ]}
        />
      )}
    </div>
  );
}

function ReportsTab({
  flock,
  data,
  currency,
}: {
  flock: any;
  data: OperationalData;
  currency?: string;
}) {
  const totalEggs = data.eggs.reduce(
    (sum, record) =>
      sum + Number(record.egg_count || 0),
    0
  );

  const totalFeed = data.feed.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg || 0),
    0
  );

  const totalMortality = data.mortality.reduce(
    (sum, record) =>
      sum + Number(record.quantity || 0),
    0
  );

  const flockRevenue = data.sales.reduce(
    (sum, record) =>
      sum + Number(record.total_amount || 0),
    0
  );

  const flockMortalityRate =
    Number(flock.quantity || 0) > 0
      ? (totalMortality / Number(flock.quantity)) *
        100
      : 0;

  const totalHealthCost = data.health.reduce(
    (sum, record) =>
      sum + Number(record.cost || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Flock Performance Report
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          A live summary calculated from the operational records currently
          linked to {flock.flock_name}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          title="Eggs"
          value={formatNumber(totalEggs)}
          icon={Egg}
        />

        <KpiCard
          title="Feed"
          value={`${formatNumber(totalFeed)} kg`}
          icon={Package}
        />

        <KpiCard
          title="Mortality"
          value={formatNumber(totalMortality)}
          icon={Skull}
        />

        <KpiCard
          title="Mortality Rate"
          value={`${flockMortalityRate.toFixed(2)}%`}
          icon={HeartPulse}
        />

        <KpiCard
          title="Sales Revenue"
          value={formatCurrency(
            flockRevenue,
            currency
          )}
          icon={ShoppingCart}
        />

        <KpiCard
          title="Health Cost"
          value={formatCurrency(
            totalHealthCost,
            currency
          )}
          icon={HeartPulse}
        />

        <KpiCard
          title="Available Birds"
          value={formatNumber(
            flock.available_birds ??
              Number(flock.quantity || 0) -
                totalMortality
          )}
          icon={Activity}
        />

        <KpiCard
          title="Starting Birds"
          value={formatNumber(flock.quantity)}
          icon={Package}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h4 className="text-lg font-bold text-slate-900">
          Record Coverage
        </h4>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Production Records"
            value={formatNumber(data.eggs.length)}
          />

          <InfoCard
            label="Feed Records"
            value={formatNumber(data.feed.length)}
          />

          <InfoCard
            label="Health Records"
            value={formatNumber(data.health.length)}
          />

          <InfoCard
            label="Mortality Records"
            value={formatNumber(data.mortality.length)}
          />

          <InfoCard
            label="Sales Records"
            value={formatNumber(data.sales.length)}
          />

          <InfoCard
            label="Farm Expense Records"
            value={formatNumber(data.expenses.length)}
          />
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  data,
}: {
  data: OperationalData;
}) {
  const activities = useMemo(() => {
    const result: {
      id: string;
      date: string;
      type: string;
      description: string;
      value?: string;
    }[] = [];

    data.eggs.forEach((record) => {
      result.push({
        id: `egg-${record.id}`,
        date: record.production_date,
        type: "Production",
        description: "Egg production recorded",
        value: `${formatNumber(
          record.egg_count
        )} eggs`,
      });
    });

    data.feed.forEach((record) => {
      result.push({
        id: `feed-${record.id}`,
        date: record.feed_date,
        type: "Feed",
        description: `${
          record.feed_type || "Feed"
        } recorded`,
        value: `${formatNumber(
          record.quantity_kg
        )} kg`,
      });
    });

    data.health.forEach((record) => {
      result.push({
        id: `health-${record.id}`,
        date: record.health_date,
        type: "Health",
        description:
          record.treatment_name ||
          "Health record recorded",
        value: record.category || undefined,
      });
    });

    data.mortality.forEach((record) => {
      result.push({
        id: `mortality-${record.id}`,
        date: record.mortality_date,
        type: "Mortality",
        description:
          record.reason ||
          "Mortality recorded",
        value: `${formatNumber(
          record.quantity
        )} birds`,
      });
    });

    data.sales.forEach((record) => {
      result.push({
        id: `sale-${record.id}`,
        date: record.sale_date,
        type: "Sale",
        description:
          record.item_type ||
          "Sale recorded",
        value: formatCurrency(
          record.total_amount
        ),
      });
    });

    data.expenses.forEach((record) => {
      result.push({
        id: `expense-${record.id}`,
        date: record.expense_date,
        type: "Farm Expense",
        description:
          record.category ||
          "Expense recorded",
        value: formatCurrency(
          record.amount
        ),
      });
    });

    return result.sort((a, b) => {
      return (
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
      );
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Activity
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Combined operational activity associated with this flock.
          Farm-level expenses are included separately.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="No Activity Yet"
          description="Operational records associated with this flock will appear here."
          icon={Activity}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-5 transition hover:bg-slate-50"
              >
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Activity
                    size={18}
                    className="text-blue-600"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {activity.type}
                      </span>

                      <p className="mt-1 font-semibold text-slate-900">
                        {activity.description}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400">
                      {formatDate(activity.date)}
                    </span>
                  </div>

                  {activity.value && (
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlockDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const { user } = useAuth();
  const { farm } = useCurrentFarm();

  const [flock, setFlock] = useState<any | null>(null);
  const [availableBirds, setAvailableBirds] = useState(0);

  const [operationalData, setOperationalData] =
    useState<OperationalData>({
      eggs: [],
      feed: [],
      health: [],
      mortality: [],
      sales: [],
      expenses: [],
    });

  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [recordsError, setRecordsError] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<TabId>("overview");

  const flockId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  useEffect(() => {
    async function loadFlock() {
      if (!flockId) return;

      try {
        setLoading(true);
        setError(null);

        const [flockData, available] =
          await Promise.all([
            getFlockById(flockId),
            getFlockAvailableBirds(flockId),
          ]);

        setFlock(flockData);
        setAvailableBirds(available);
      } catch (err) {
        console.error(
          "Error loading flock:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load flock."
        );

        setFlock(null);
      } finally {
        setLoading(false);
      }
    }

    loadFlock();
  }, [flockId]);

  /*
   * ---------------------------------------------------------
   * LOAD OPERATIONAL RECORDS
   * ---------------------------------------------------------
   *
   * We deliberately query the existing operational tables
   * using the flock_id relationships already used throughout
   * PoultryOps.
   *
   * Expenses are different: the existing schema stores them
   * at farm level, so they are filtered by farm_id only.
   */
  useEffect(() => {
    async function loadOperationalData() {
      if (!flockId || !flock?.farm_id) {
        return;
      }

      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const [
          eggsResult,
          feedResult,
          healthResult,
          mortalityResult,
          salesResult,
          expensesResult,
        ] = await Promise.all([
          supabase
            .from("egg_production")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .eq("flock_id", flockId)
            .order("production_date", {
              ascending: false,
            }),

          supabase
            .from("feed_records")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .eq("flock_id", flockId)
            .order("feed_date", {
              ascending: false,
            }),

          supabase
            .from("health")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .eq("flock_id", flockId)
            .order("health_date", {
              ascending: false,
            }),

          supabase
            .from("mortality")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .eq("flock_id", flockId)
            .order("mortality_date", {
              ascending: false,
            }),

          supabase
            .from("sales")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .eq("flock_id", flockId)
            .order("sale_date", {
              ascending: false,
            }),

          supabase
            .from("expenses")
            .select("*")
            .eq("farm_id", flock.farm_id)
            .order("expense_date", {
              ascending: false,
            }),
        ]);

        const results = [
          eggsResult,
          feedResult,
          healthResult,
          mortalityResult,
          salesResult,
          expensesResult,
        ];

        const failed = results.find(
          (result) => result.error
        );

        if (failed?.error) {
          throw failed.error;
        }

        setOperationalData({
          eggs: eggsResult.data || [],
          feed: feedResult.data || [],
          health: healthResult.data || [],
          mortality: mortalityResult.data || [],
          sales: salesResult.data || [],
          expenses: expensesResult.data || [],
        });
      } catch (err) {
        console.error(
          "Error loading flock operational records:",
          err
        );

        setRecordsError(
          err instanceof Error
            ? err.message
            : "Unable to load operational records."
        );
      } finally {
        setRecordsLoading(false);
      }
    }

    loadOperationalData();
  }, [flockId, flock?.farm_id]);

  async function handleArchive() {
    if (!flockId) return;

    const confirmed = confirm(
      "Are you sure you want to archive this flock? Archived flocks will be hidden from the list but all data will be preserved."
    );

    if (!confirmed) return;

    try {
      await archiveFlock(flockId);
      router.push("/flocks");
    } catch (err) {
      console.error(
        "Failed to archive flock:",
        err
      );

      alert(
        "Unable to archive this flock. Please try again."
      );
    }
  }

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-10 w-80 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-96 animate-pulse rounded bg-slate-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </AppShell>
    );
  }

  if (error || !flock) {
    return (
      <AppShell email={user?.email}>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package
                size={30}
                className="text-red-600"
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              Flock Not Found
            </h2>

            <p className="mt-2 text-slate-500">
              {error ||
                "The flock you're looking for doesn't exist or you don't have permission to view it."}
            </p>

            <button
              onClick={() => router.push("/flocks")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={18} />
              Back to Flocks
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const currentStatus =
    flock.status || "Active";

  const activeTabObject =
    TABS.find(
      (tab) => tab.id === activeTab
    ) || TABS[0];

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-slate-500 transition hover:text-blue-600"
          >
            Dashboard
          </button>

          <span className="text-slate-300">/</span>

          <button
            onClick={() =>
              router.push("/flocks")
            }
            className="text-slate-500 transition hover:text-blue-600"
          >
            Flocks
          </button>

          <span className="text-slate-300">/</span>

          <span className="font-medium text-slate-900">
            {flock.flock_name}
          </span>
        </nav>

        {/* Flock Header */}
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  {flock.flock_name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                    currentStatus
                  )}`}
                >
                  {currentStatus}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${birdTypeClasses(
                    flock.bird_type
                  )}`}
                >
                  {flock.bird_type}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-700">
                {flock.breed && (
                  <span className="font-medium">
                    {flock.breed}
                  </span>
                )}

                {flock.batch_number && (
                  <span className="inline-flex items-center gap-2">
                    <Package size={16} />
                    Batch: {flock.batch_number}
                  </span>
                )}

                <span className="inline-flex items-center gap-2">
                  <Activity size={16} />
                  {formatNumber(flock.quantity)} birds
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  router.push("/flocks")
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
                Back to Flocks
              </button>

              <button
                onClick={() =>
                  router.push(
                    `/flocks/${flockId}/edit`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
              >
                <Edit size={18} />
                Edit
              </button>

              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
              >
                <Archive size={18} />
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Activity
              size={20}
              className="text-blue-600"
            />

            <h2 className="text-xl font-bold text-slate-900">
              Flock Dashboard
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              title="Available Birds"
              value={formatNumber(
                availableBirds
              )}
              icon={Activity}
              description="Currently available"
            />

            <KpiCard
              title="Starting Birds"
              value={formatNumber(
                flock.quantity
              )}
              icon={Package}
              description="Registered quantity"
            />

<KpiCard
  title="Age at Start"
  value={formatAgeAtStart(
    flock.age_weeks
  )}
  icon={Calendar}
/>

<KpiCard
  title="Current Age"
  value={formatCurrentAge(
    flock
  )}
  icon={Calendar}
/>

            <KpiCard
              title="Arrival"
              value={formatLongDate(
                flock.arrival_date
              )}
              icon={Truck}
            />

            <KpiCard
              title="Supplier"
              value={
                flock.supplier ||
                "Not recorded"
              }
              icon={Package}
            />
          </div>
        </div>

        {/* Operational Workspace */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto border-b border-slate-200 bg-slate-50">
            <div className="flex min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active =
                  activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={`relative inline-flex items-center gap-2 px-6 py-4 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} />

                    {tab.label}

                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {recordsLoading &&
              activeTab !== "overview" && (
                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Loading {activeTabObject.label.toLowerCase()} records...
                </div>
              )}

            {recordsError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load operational records:{" "}
                {recordsError}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    General Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Core information recorded for this flock.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <InfoCard
                    label="Batch Number"
                    value={
                      flock.batch_number ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Bird Type"
                    value={
                      flock.bird_type ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Breed"
                    value={
                      flock.breed ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Supplier"
                    value={
                      flock.supplier ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Housing"
                    value={
                      flock.house ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Pen"
                    value={
                      flock.pen ||
                      "Not recorded"
                    }
                  />

                  <InfoCard
                    label="Arrival Date"
                    value={formatLongDate(
                      flock.arrival_date
                    )}
                  />

<InfoCard
  label="Age at Start"
  value={formatAgeAtStart(
    flock.age_weeks
  )}
/>

<InfoCard
  label="Current Age"
  value={formatCurrentAge(
    flock
  )}
/>

                  <InfoCard
                    label="Starting Birds"
                    value={formatNumber(
                      flock.quantity
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Notes
                  </h3>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
            )}

            {activeTab === "production" && (
              <ProductionTab
                records={operationalData.eggs}
                flock={flock}
              />
            )}

            {activeTab === "feed" && (
              <FeedTab
                records={operationalData.feed}
                flock={flock}
              />
            )}

            {activeTab === "health" && (
              <HealthTab
                records={operationalData.health}
                flock={flock}
                currency={farm?.currency}
              />
            )}

            {activeTab === "mortality" && (
              <MortalityTab
                records={operationalData.mortality}
                flock={flock}
              />
            )}

            {activeTab === "sales" && (
              <SalesTab
                records={operationalData.sales}
                flock={flock}
                currency={farm?.currency}
              />
            )}

            {activeTab === "expenses" && (
              <ExpensesTab
                records={operationalData.expenses}
                currency={farm?.currency}
              />
            )}

            {activeTab === "reports" && (
              <ReportsTab
                flock={{
                  ...flock,
                  available_birds:
                    availableBirds,
                }}
                data={operationalData}
                currency={farm?.currency}
              />
            )}

            {activeTab === "activity" && (
              <ActivityTab
                data={operationalData}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
          <span>
            Registered{" "}
            {formatLongDate(
              flock.created_at
            )}
          </span>

          {flock.updated_at && (
            <span>
              Last updated{" "}
              {formatLongDate(
                flock.updated_at
              )}
            </span>
          )}

          {farm?.name && (
            <span>
              Farm: {farm.name}
            </span>
          )}
        </div>
      </div>
    </AppShell>
  );
}