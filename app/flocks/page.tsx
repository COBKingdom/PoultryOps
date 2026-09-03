"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useFlocks } from "@/hooks/useFlocks";

import AppShell from "@/components/layout/app-shell";

import {
  createFlock,
  updateFlock,
} from "@/lib/flocks";

import FlockModal from "@/components/flocks/flock-modal";
import FlockCard from "@/components/flocks/flock-card";

import { canEdit } from "@/lib/permissions";

import {
  Calendar,
  Filter,
  Package,
  RefreshCw,
  Search,
  X,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 10;

const AGE_FILTERS = [
  { value: "all", label: "All Ages" },
  { value: "0-4", label: "0–4 weeks" },
  { value: "5-8", label: "5–8 weeks" },
  { value: "9-12", label: "9–12 weeks" },
  { value: "13-16", label: "13–16 weeks" },
  { value: "17-20", label: "17–20 weeks" },
  { value: "21-24", label: "21–24 weeks" },
  { value: "25+", label: "25+ weeks" },
];

function safeNumber(value: unknown): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const parsed = Number(
    String(value).replace(/,/g, "").trim()
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

/**
 * Returns the flock's current age in days.
 *
 * age_weeks is the age of the birds when the flock
 * was registered/started.
 *
 * We use arrival_date as the biological start date
 * when available, and created_at as the fallback.
 */
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

  const startingAgeWeeks = Number(
    flock.age_weeks
  );

  if (
    !Number.isFinite(startingAgeWeeks) ||
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

  if (Number.isNaN(startDate.getTime())) {
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
    Math.round(startingAgeWeeks * 7) +
    elapsedDays
  );
}

function getCurrentAgeWeeks(
  flock: any
): number | null {
  const days =
    getCurrentAgeDays(flock);

  if (days === null) {
    return null;
  }

  return days / 7;
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

function matchesAgeFilter(
  flock: any,
  filter: string
): boolean {
  if (filter === "all") {
    return true;
  }

  const currentAgeWeeks =
    getCurrentAgeWeeks(flock);

  if (
    currentAgeWeeks === null ||
    !Number.isFinite(currentAgeWeeks)
  ) {
    return false;
  }

  switch (filter) {
    case "0-4":
      return (
        currentAgeWeeks >= 0 &&
        currentAgeWeeks <= 4
      );

    case "5-8":
      return (
        currentAgeWeeks >= 5 &&
        currentAgeWeeks <= 8
      );

    case "9-12":
      return (
        currentAgeWeeks >= 9 &&
        currentAgeWeeks <= 12
      );

    case "13-16":
      return (
        currentAgeWeeks >= 13 &&
        currentAgeWeeks <= 16
      );

    case "17-20":
      return (
        currentAgeWeeks >= 17 &&
        currentAgeWeeks <= 20
      );

    case "21-24":
      return (
        currentAgeWeeks >= 21 &&
        currentAgeWeeks <= 24
      );

    case "25+":
      return currentAgeWeeks >= 25;

    default:
      return true;
  }
}

export default function FlocksPage() {
  const { user, profile } =
    useAuth();

  const {
    farm,
    loading: farmLoading,
    error: farmError,
    retry: retryFarm,
  } = useCurrentFarm();

  const farmId = farm?.id;

  const {
    flocks,
    loading: flocksLoading,
    error: flocksError,
    refresh,
  } = useFlocks(farmId);

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    editingFlock,
    setEditingFlock,
  ] = useState<any | null>(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    birdTypeFilter,
    setBirdTypeFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    ageFilter,
    setAgeFilter,
  ] = useState("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const totalBirds =
    flocks.reduce(
      (sum, flock) =>
        sum +
        safeNumber(
          flock.quantity
        ),
      0
    );

  /*
   * ---------------------------------------------------------
   * FILTERED FLOCKS
   * ---------------------------------------------------------
   */
  const filteredFlocks =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return flocks.filter(
        (flock) => {
          const matchesSearch =
            !query ||
            [
              flock.flock_name,
              flock.batch_number,
              flock.bird_type,
              flock.breed,
              flock.supplier,
              flock.house,
              flock.pen,
              flock.status,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(query)
            );

          const matchesBirdType =
            birdTypeFilter === "all" ||
            flock.bird_type ===
              birdTypeFilter;

          const matchesStatus =
            statusFilter === "all" ||
            (flock.status ||
              "Active") ===
              statusFilter;

          const matchesAge =
            matchesAgeFilter(
              flock,
              ageFilter
            );

          return (
            matchesSearch &&
            matchesBirdType &&
            matchesStatus &&
            matchesAge
          );
        }
      );
    }, [
      flocks,
      searchQuery,
      birdTypeFilter,
      statusFilter,
      ageFilter,
    ]);

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */
  const totalItems =
    filteredFlocks.length;

  const totalPages =
    Math.ceil(
      totalItems / PAGE_SIZE
    ) || 1;

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const startIndex =
    (safeCurrentPage - 1) *
    PAGE_SIZE;

  const paginatedFlocks =
    filteredFlocks.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  /*
   * Reset pagination whenever
   * search or filters change.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    birdTypeFilter,
    statusFilter,
    ageFilter,
  ]);

  /*
   * Keep the current page valid if
   * the result count changes.
   */
  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    birdTypeFilter !== "all" ||
    statusFilter !== "all" ||
    ageFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setBirdTypeFilter("all");
    setStatusFilter("all");
    setAgeFilter("all");
    setCurrentPage(1);
  }

  async function handleSave(
    values: any
  ) {
    if (editingFlock) {
      await updateFlock(
        editingFlock.id,
        values
      );
    } else {
      await createFlock({
        ...values,
        farm_id: farmId,
      });
    }

    await refresh();
    handleCloseModal();
  }

  function handleEdit(
    flock: any
  ) {
    const governanceResult =
      canEdit(
        {
          id: user?.id || "",
          role:
            profile?.role || "",
        },
        flock
      );

    if (
      !governanceResult.allowed
    ) {
      alert(
        governanceResult.reason ||
          "You cannot edit this flock at this time."
      );
      return;
    }

    setEditingFlock(flock);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingFlock(null);
  }

  const isLoading =
    farmLoading ||
    flocksLoading;

  if (isLoading) {
    return (
      <AppShell
        email={user?.email}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="h-12 w-48 animate-pulse rounded-xl bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  </div>

                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200" />

                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (
    farmError ||
    flocksError
  ) {
    return (
      <AppShell
        email={user?.email}
      >
        <div className="flex h-96 items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package
                className="text-red-600"
                size={32}
              />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              Unable to Load Flocks
            </h2>

            <p className="mb-6 text-slate-500">
              We couldn't load your
              flocks. Please refresh
              the page or try again.
            </p>

            <button
              onClick={() => {
                retryFarm();
                refresh();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const birdTypes = Array.from(
    new Set(
      flocks
        .map(
          (flock) =>
            flock.bird_type
        )
        .filter(Boolean)
    )
  );

  const statuses = Array.from(
    new Set(
      flocks.map(
        (flock) =>
          flock.status ||
          "Active"
      )
    )
  );

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Flocks
            </h1>

            <p className="mt-1 text-slate-500">
              Manage all poultry flocks
              for this farm.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingFlock(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <Plus size={20} />
            Register New Flock
          </button>
        </div>

        {/* Operational KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Package
                className="text-slate-600"
                size={18}
              />

              <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
                Total Flocks
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {flocks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Package
                className="text-blue-600"
                size={18}
              />

              <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
                Total Birds
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {totalBirds.toLocaleString()}
            </p>
          </div>

<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-2 flex items-center gap-2">
    <Package
      className="text-green-600"
      size={18}
    />

    <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
      Flock Types
    </p>
  </div>

  <p className="text-2xl font-bold text-slate-900">
    {birdTypes.length}
  </p>
</div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Package
                className="text-purple-600"
                size={18}
              />

              <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
                AVG. FLOCK SIZE
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {flocks.length > 0
                ? Math.round(
                    totalBirds /
                      flocks.length
                  ).toLocaleString()
                : "0"}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search flock name, batch, breed, supplier, house, pen..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Filter size={17} />
                Filters
              </div>

              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={birdTypeFilter}
                  onChange={(event) =>
                    setBirdTypeFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    All Bird Types
                  </option>

                  {birdTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    All Statuses
                  </option>

                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={ageFilter}
                  onChange={(event) =>
                    setAgeFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {AGE_FILTERS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Result Summary */}
        {flocks.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {totalItems === 0
                  ? 0
                  : startIndex + 1}
                –
                {Math.min(
                  startIndex +
                    paginatedFlocks.length,
                  totalItems
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {totalItems}
              </span>{" "}
              flocks
            </p>

            {hasActiveFilters && (
              <p className="text-xs text-blue-600">
                Filters applied
              </p>
            )}
          </div>
        )}

        {/* Flock List */}
        {flocks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Package
                className="text-blue-600"
                size={40}
              />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              No Flocks Yet
            </h2>

            <p className="mx-auto mb-6 max-w-md text-slate-500">
              Get started by registering
              your first flock. Track
              production, monitor health,
              and manage your poultry
              operations efficiently.
            </p>

            <button
              onClick={() => {
                setEditingFlock(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
            >
              <Plus size={20} />
              Register Your First Flock
            </button>
          </div>
        ) : filteredFlocks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Search
                className="text-slate-500"
                size={30}
              />
            </div>

            <h2 className="mb-2 text-xl font-bold text-slate-900">
              No Matching Flocks
            </h2>

            <p className="mx-auto mb-5 max-w-md text-sm text-slate-500">
              No flocks match the current
              search and filter selections.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear Search & Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedFlocks.map(
                (flock) => (
                  <FlockCard
                    key={flock.id}
                    flock={flock}
                    onEdit={
                      handleEdit
                    }
                  />
                )
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-700">
                    {safeCurrentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      safeCurrentPage <=
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage >=
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <FlockModal
          isOpen={isModalOpen}
          onClose={
            handleCloseModal
          }
          onSave={handleSave}
          flock={editingFlock}
        />
      </div>
    </AppShell>
  );
}