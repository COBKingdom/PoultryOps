"use client";

import { useState, useEffect } from "react";

import {
  updateHealth,
} from "@/lib/health";

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

export default function EditHealthForm({
  record,
  flocks,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [flockId, setFlockId] = useState(record.flock_id || "");
  const [treatmentName, setTreatmentName] = useState(record.treatment_name || "");
  const [category, setCategory] = useState(record.category || "Vaccine");
  const [cost, setCost] = useState(record.cost?.toString() || "");
  const [notes, setNotes] = useState(record.notes || "");
  const [recordDate, setRecordDate] = useState(
    record.health_date || new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [governanceError, setGovernanceError] = useState<string | null>(null);

  useEffect(() => {
    // Check Edit Governance on mount
    const governanceResult = canEdit(
      { id: user?.id || "", role: profile?.role || "" },
      record
    );

    if (!governanceResult.allowed) {
      setGovernanceError(
        governanceResult.reason ||
          "You cannot edit this record at this time."
      );
      return;
    }
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

      await updateHealth(record.id, {
        flock_id: flockId,
        health_date: recordDate,
        treatment_name: treatmentName,
        category: category,
        cost: Number(cost || 0),
        notes: notes,
      });

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
            Edit Health Record
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
          Edit Health Record
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
          onChange={(e) =>
            setRecordDate(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        >
          <option value="">
            Select Flock
          </option>

          {flocks.map((flock: any) => (
            <option
              key={flock.id}
              value={flock.id}
            >
              {flock.flock_name}
            </option>
          ))}
        </select>

        <input
          placeholder="Treatment Name"
          value={treatmentName}
          onChange={(e) =>
            setTreatmentName(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        >
          <option>Vaccine</option>
          <option>Antibiotic</option>
          <option>Vitamin</option>
          <option>Supplement</option>
          <option>Treatment</option>
          <option>Deworming</option>
          <option>Biosecurity</option>
          <option>Disinfectant</option>
          <option>Health Inspection</option>
        </select>

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) =>
            setCost(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Update Health Record"
        />
      </form>
    </div>
  );
}