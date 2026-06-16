"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useSales } from "@/hooks/useSales";

import AppShell from "@/components/layout/app-shell";

import AddSaleForm from "@/components/sales/add-sale-form";
import SalesList from "@/components/sales/sales-list";
import SalesSummary from "@/components/sales/sales-summary";

export default function SalesPage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const {
    records,
  } = useSales(
    farm?.id
  );

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Sales Management
        </h1>

        <SalesSummary
          records={records}
        />

        <SalesList
          records={records}
        />

        <AddSaleForm
          farmId={farm?.id}
        />

      </div>
    </AppShell>
  );
}