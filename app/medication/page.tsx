"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useMedication } from "@/hooks/useMedication";
import { useFlocks } from "@/hooks/useFlocks";

import AddMedicationForm from "@/components/medication/add-medication-form";
import MedicationList from "@/components/medication/medication-list";

export default function MedicationPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    flocks,
  } = useFlocks(
    farmId
  );

  const {
    records,
  } = useMedication(
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
        Medication
      </h1>

      <AddMedicationForm
        farmId={farmId}
        flocks={flocks}
      />

      <MedicationList
        records={records}
      />

    </div>
  );
}