"use client";

import { useState } from "react";

import { createFlock } from "@/lib/flocks";

type Props = {
  farmId: string;
  onCreated?: () => void;
};

export default function AddFlockForm({
  farmId,
  onCreated,
}: Props) {
  const [flockName, setFlockName] =
    useState("");

  const [birdType, setBirdType] =
    useState("Layers");

  const [quantity, setQuantity] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      await createFlock({
        farm_id: farmId,
        flock_name: flockName,
        bird_type: birdType,
        quantity:
          Number(quantity),
      });

      setFlockName("");
      setQuantity("");

      onCreated?.();

    } catch (error) {
      console.error(error);
      alert("Failed to save flock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg mb-4">
        Add Flock
      </h2>

      <div className="space-y-3">

        <input
          placeholder="Flock Name"
          value={flockName}
          onChange={(e) =>
            setFlockName(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <select
          value={birdType}
          onChange={(e) =>
            setBirdType(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>
            Layers
          </option>

          <option>
            Broilers
          </option>

          <option>
            Cockerels
          </option>
        </select>

        <input
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(
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
            : "Save Flock"}
        </button>

      </div>
    </div>
  );
}