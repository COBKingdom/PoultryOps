"use client";

import { useState } from "react";
import { createMortality } from "@/lib/mortality";

type Props = {
  farmId: string;
  flocks: any[];
};

export default function AddMortalityForm({
  farmId,
  flocks,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
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

      await createMortality({
        farm_id: farmId,
        flock_id: flockId,
        mortality_date:
          new Date()
            .toISOString()
            .split("T")[0],
        quantity:
          Number(quantity),
        reason,
      });

      setQuantity("");
      setReason("");

      alert(
        "Mortality recorded"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save mortality"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg mb-4">
        Record Mortality
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
          type="number"
          placeholder="Mortality Quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Reason"
          value={reason}
          onChange={(e) =>
            setReason(
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
            : "Save Mortality"}
        </button>

      </div>
    </div>
  );
}