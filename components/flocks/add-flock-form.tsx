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

      alert(
        "Flock created successfully"
      );

      onCreated?.();

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save flock"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Add New Flock
      </h2>

      <div className="space-y-4">

        <input
          placeholder="Flock Name"
          value={flockName}
          onChange={(e) =>
            setFlockName(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <select
          value={birdType}
          onChange={(e) =>
            setBirdType(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
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
          type="number"
          placeholder="Bird Quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

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
            : "Create Flock"}
        </button>

      </div>

    </div>
  );
}