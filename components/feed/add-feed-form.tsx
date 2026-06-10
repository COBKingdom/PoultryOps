"use client";

import { useState } from "react";

import {
  createFeedRecord,
} from "@/lib/feed";

type Props = {
  farmId: string;
  flocks: any[];
};

export default function AddFeedForm({
  farmId,
  flocks,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [feedType, setFeedType] =
    useState("");

  const [quantityKg, setQuantityKg] =
    useState("");

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

      await createFeedRecord({
        farm_id: farmId,
        flock_id: flockId,
        feed_date:
          new Date()
            .toISOString()
            .split("T")[0],
        feed_type:
          feedType,
        quantity_kg:
          Number(
            quantityKg
          ),
      });

      setFeedType("");
      setQuantityKg("");

      alert(
        "Feed recorded"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save feed"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Record Feed
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
          placeholder="Feed Type"
          value={feedType}
          onChange={(e) =>
            setFeedType(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Quantity (kg)"
          value={quantityKg}
          onChange={(e) =>
            setQuantityKg(
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
            : "Save Feed"}
        </button>

      </div>
    </div>
  );
}