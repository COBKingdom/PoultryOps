"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSales } from "@/hooks/useSales";

import AddSaleForm from "@/components/sales/add-sale-form";
import SalesList from "@/components/sales/sales-list";
import SalesSummary from "@/components/sales/sales-summary";

export default function SalesPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    records,
  } = useSales(
    farmId
  );

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

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
        farmId={farmId}
      />

    </div>
  );
}