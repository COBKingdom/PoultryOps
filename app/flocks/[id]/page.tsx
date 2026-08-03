"use client";

import { useState, useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";

import AppShell from "@/components/layout/app-shell";

import { getFlockById, getFlockAvailableBirds } from "@/lib/flocks";

import {
  ArrowLeft,
  Edit,
  Archive,
  Package,
  Calendar,
  MapPin,
  User,
  FileText,
  Egg,
  Beef,
  TrendingUp,
  ReceiptText,
  Wallet,
  Activity,
  Loader2,
  Home,
} from "lucide-react";

import KpiCard from "@/components/dashboard/kpi-card";

type TabType = "overview" | "production" | "feed" | "health" | "mortality" | "sales" | "expenses" | "reports" | "activity";

export default function FlockWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { farm } = useCurrentFarm();

  const [flock, setFlock] = useState<any>(null);
  const [availableBirds, setAvailableBirds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const flockId = params.id as string;

  useEffect(() => {
    async function loadFlock() {
      if (!flockId) return;

      try {
        setLoading(true);
        const data = await getFlockById(flockId);
        setFlock(data);

        const available = await getFlockAvailableBirds(flockId);
        setAvailableBirds(available);
      } catch (error) {
        console.error("Error loading flock:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFlock();
  }, [flockId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBirdTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Layers: "bg-blue-100 text-blue-700 border-blue-200",
      Broilers: "bg-green-100 text-green-700 border-green-200",
      Growers: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Cockerels: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[type] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Draft: "bg-amber-100 text-amber-700 border-amber-200",
      Completed: "bg-blue-100 text-blue-700 border-blue-200",
      Archived: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const handleEdit = () => {
    router.push(`/flocks/${flockId}/edit`);
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this flock? Archived flocks will be hidden from the list but all data will be preserved.")) {
      return;
    }

    try {
      const { archiveFlock } = await import("@/lib/flocks");
      await archiveFlock(flockId);
      router.push("/flocks");
    } catch (error) {
      console.error("Failed to archive flock:", error);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "production", label: "Production" },
    { id: "feed", label: "Feed" },
    { id: "health", label: "Health" },
    { id: "mortality", label: "Mortality" },
    { id: "sales", label: "Sales" },
    { id: "expenses", label: "Expenses" },
    { id: "reports", label: "Reports" },
    { id: "activity", label: "Activity" },
  ];

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>

          {/* Hero Header Skeleton */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-100 p-8 shadow-lg">
            <div className="space-y-4">
              <div className="h-12 w-96 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* KPI Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-12 w-12 bg-slate-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-40 bg-slate-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!flock) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Flock Not Found
            </h2>
            <p className="text-slate-500 mb-6">
              The flock you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <button
              onClick={() => router.push("/flocks")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all"
            >
              <ArrowLeft size={20} />
              Back to Flocks
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <Home size={14} />
            Dashboard
          </button>
          <span className="text-slate-400">/</span>
          <button
            onClick={() => router.push("/flocks")}
            className="text-slate-600 hover:text-blue-600 transition-colors"
          >
            Flocks
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium">{flock.flock_name}</span>
        </nav>

        {/* Workspace Header - Enhanced Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-100 p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                  {flock.flock_name}
                </h1>
                <span className={`rounded-full px-4 py-1.5 text-xs font-bold border-2 ${getStatusColor(flock.status || "Active")}`}>
                  {flock.status || "Active"}
                </span>
                <span className={`rounded-full px-4 py-1.5 text-xs font-bold border-2 ${getBirdTypeColor(flock.bird_type)}`}>
                  {flock.bird_type}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
                {flock.breed && (
                  <span className="flex items-center gap-2 font-medium">
                    <Beef size={18} className="text-slate-600" />
                    {flock.breed}
                  </span>
                )}
                {flock.batch_number && (
                  <span className="flex items-center gap-2 font-medium">
                    <Package size={18} className="text-slate-600" />
                    Batch: {flock.batch_number}
                  </span>
                )}
                {flock.quantity && (
                  <span className="flex items-center gap-2 font-medium">
                    <Activity size={18} className="text-slate-600" />
                    {Number(flock.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} birds
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push("/flocks")}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
              >
                <ArrowLeft size={18} />
                Back to Flocks
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all shadow-sm hover:shadow-md"
              >
                <Edit size={18} />
                Edit
              </button>
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-all shadow-sm hover:shadow-md"
              >
                <Archive size={18} />
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* KPI Dashboard - Emphasized Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Flock Dashboard</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Available Birds"
              value={Number(availableBirds).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            />

            <KpiCard
              title="Starting Birds"
              value={Number(flock.quantity).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            />
            {flock.age_weeks && (
              <KpiCard
                title="Age"
                value={`${flock.age_weeks} ${flock.age_weeks === 1 ? 'week' : 'weeks'}`}
              />
            )}
            {flock.arrival_date && (
              <KpiCard
                title="Arrival Date"
                value={formatDate(flock.arrival_date)}
              />
            )}
            {flock.supplier && (
              <KpiCard
                title="Supplier"
                value={flock.supplier}
              />
            )}

            {/* Reserved KPI Cards - Coming Soon */}
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Today's Eggs
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <Egg size={26} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Feed Today
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <Activity size={26} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Mortality Today
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <Activity size={26} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Revenue
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <TrendingUp size={26} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Expenses
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <ReceiptText size={26} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-5 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Profit
                  </p>
                  <p className="mt-3 text-sm text-slate-400">No records yet</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200">
                  <Wallet size={26} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 overflow-x-auto bg-slate-50">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? "text-blue-600 bg-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flock.batch_number && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Batch Number</p>
                        <p className="text-base font-bold text-slate-900">{flock.batch_number}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Bird Type</p>
                      <p className="text-base font-bold text-slate-900">{flock.bird_type}</p>
                    </div>
                    {flock.breed && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Breed</p>
                        <p className="text-base font-bold text-slate-900">{flock.breed}</p>
                      </div>
                    )}
                    {flock.supplier && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Source</p>
                        <p className="text-base font-bold text-slate-900">{flock.supplier}</p>
                      </div>
                    )}
                    {flock.house && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Housing</p>
                        <p className="text-base font-bold text-slate-900">{flock.house}</p>
                      </div>
                    )}
                    {flock.pen && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Pen</p>
                        <p className="text-base font-bold text-slate-900">{flock.pen}</p>
                      </div>
                    )}
                    {flock.arrival_date && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Arrival Date</p>
                        <p className="text-base font-bold text-slate-900">{formatDate(flock.arrival_date)}</p>
                      </div>
                    )}
                    {flock.supplier && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Supplier</p>
                        <p className="text-base font-bold text-slate-900">{flock.supplier}</p>
                      </div>
                    )}
                    {flock.purchase_cost && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Purchase Cost</p>
                        <p className="text-base font-bold text-slate-900">{formatDate(flock.purchase_cost)}</p>
                      </div>
                    )}
                    {flock.transport_cost && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Transport Cost</p>
                        <p className="text-base font-bold text-slate-900">{formatDate(flock.transport_cost)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {flock.notes && (
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      Notes
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{flock.notes}</p>
                    </div>
                  </div>
                )}

                {!flock.notes && (
                  <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <FileText size={40} className="mx-auto mb-3 text-slate-400" />
                    <p className="font-medium">No notes available.</p>
                    <p className="text-xs mt-1">Add notes to keep track of important information about this flock.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab !== "overview" && (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Activity className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Coming in the Next Release
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  The {tabs.find(t => t.id === activeTab)?.label} module is currently under development and will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-xs text-slate-500 text-center">
          Registered {formatDate(flock.created_at)}
          {flock.updated_at && ` • Updated ${formatDate(flock.updated_at)}`}
        </div>
      </div>
    </AppShell>
  );
}