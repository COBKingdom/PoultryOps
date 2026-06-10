"use client";

import { useState } from "react";
import { createEggProduction } from "@/lib/eggs";

type Props = {
  farmId: string;
  flocks: any[];
};

export default function AddEggForm({
  farmId,
  flocks,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [eggCount, setEggCount] =
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

      await createEggProduction({
        farm_id: farmId,
        flock_id: flockId,
        production_date:
          new Date()
            .toISOString()
            .split("T")[0],
        egg_count:
          Number(eggCount),
      });

      setEggCount("");

      alert(
        "Egg production saved"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg mb-4">
        Record Egg Production
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
          placeholder="Egg Count"
          value={eggCount}
          onChange={(e) =>
            setEggCount(
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
            : "Save Production"}
        </button>

      </div>
    </div>
  );
}