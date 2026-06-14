"use client";

import { useState } from "react";

import { createHealthRecord } from "@/lib/health";

type Props = {
  farmId: string;
  flocks: any[];
};

export default function AddHealthForm({
  farmId,
  flocks,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [treatmentName, setTreatmentName] =
    useState("");

  const [category, setCategory] =
    useState("Vaccine");

  const [cost, setCost] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      if (!flockId) {
        alert("Select a flock");
        return;
      }

      setLoading(true);

      await createHealthRecord({
        farm_id: farmId,
        flock_id: flockId,
        health_date:
          new Date()
            .toISOString()
            .split("T")[0],
        treatment_name:
          treatmentName,
        category,
        cost:
          Number(cost || 0),
        notes,
      });

      setTreatmentName("");
      setCost("");
      setNotes("");

      alert(
        "Health record saved"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save health record"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Record Health Activity
      </h2>

      <div className="space-y-3">

        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option value="">
            Select Flock
          </option>

          {flocks.map(
            (flock) => (
              <option
                key={flock.id}
                value={flock.id}
              >
                {flock.flock_name}
              </option>
            )
          )}
        </select>

        <input
          placeholder="Treatment Name"
          value={treatmentName}
          onChange={(e) =>
            setTreatmentName(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>Vaccine</option>
          <option>Antibiotic</option>
          <option>Vitamin</option>
          <option>Supplement</option>
          <option>Treatment</option>
          <option>Deworming</option>
          <option>Biosecurity</option>
        </select>

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) =>
            setCost(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-slate-900 text-white p-3 rounded"
        >
          {loading
            ? "Saving..."
            : "Save Health Record"}
        </button>

      </div>

    </div>
  );
}