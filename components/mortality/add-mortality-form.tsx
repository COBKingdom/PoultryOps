"use client";

import { useState } from "react";

import {
  createMortality,
} from "@/lib/mortality";

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
    useState("Disease");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      if (!flockId) {
        alert(
          "Select a flock"
        );

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

      alert(
        "Mortality recorded successfully"
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Record Mortality
      </h2>

      <div className="space-y-4">

        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
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
          placeholder="Number of Birds"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <select
          value={reason}
          onChange={(e) =>
            setReason(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option>Disease</option>
          <option>Heat Stress</option>
          <option>Predator Attack</option>
          <option>Injury</option>
          <option>Culled</option>
          <option>Unknown</option>
          <option>Other</option>
        </select>

        <button
          onClick={handleSave}
          disabled={loading}
          className="
            w-full
            bg-slate-900
            text-white
            rounded-xl
            p-4
          "
        >
          {loading
            ? "Saving..."
            : "Save Mortality"}
        </button>

      </div>

    </div>
  );
}