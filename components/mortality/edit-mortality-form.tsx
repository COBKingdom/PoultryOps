"use client";

import { useState, useEffect } from "react";

import { updateMortality } from "@/lib/mortality";
import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

import { X } from "lucide-react";

type Props = {
  record: any;
  flocks: any[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

export default function EditMortalityForm({
  record,
  flocks,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [flockId, setFlockId] = useState(
    record.flock_id || ""
  );

  const [quantity, setQuantity] = useState(
    record.quantity?.toString() || ""
  );

  const [reason, setReason] = useState(
    record.reason || "Disease"
  );

  const [recordDate, setRecordDate] = useState(
    record.mortality_date ||
      new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [governanceError, setGovernanceError] =
    useState<string | null>(null);

  useEffect(() => {
    const governanceResult = canEdit(
      {
        id: user?.id || "",
        role: profile?.role || "",
      },
      record
    );

    if (!governanceResult.allowed) {
      setGovernanceError(
        governanceResult.reason ||
          "You cannot edit this record at this time."
      );
      return;
    }

    setGovernanceError(null);
  }, [user, profile, record]);

  async function handleSave() {
    if (governanceError) {
      return;
    }

    try {
      if (!flockId) {
        return;
      }

      setLoading(true);

await updateMortality(
  record.id,
  {
    farm_id: record.farm_id,
    flock_id: flockId,
    mortality_date: recordDate,
    quantity: Number(quantity),
    reason,
  }
);

      await onSaved?.();

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (governanceError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Edit Mortality Record
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-red-700 text-sm">
            {governanceError}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Edit Mortality Record
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <input
          type="date"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={flockId}
          onChange={(e) => setFlockId(e.target.value)}
          className="w-full border rounded-xl p-4"
          required
        >
          <option value="">Select Flock</option>

          {flocks.map((flock: any) => (
            <option key={flock.id} value={flock.id}>
              {flock.flock_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="Number of Birds"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-xl p-4"
        >
          <option>Disease</option>
          <option>Heat Stress</option>
          <option>Predator Attack</option>
          <option>Injury</option>
          <option>Culled</option>
          <option>Feed Poisoning</option>
          <option>Water Contamination</option>
          <option>Unknown</option>
          <option>Other</option>
        </select>

        <SaveButton
          loading={loading}
          success={success}
          label="Update Mortality"
        />
      </form>
    </div>
  );
}