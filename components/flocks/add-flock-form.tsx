"use client";

import { useState } from "react";

import { createFlock } from "@/lib/flocks";

import SaveButton from "@/components/ui/save-button";

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

  const [success, setSuccess] =
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

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

      onCreated?.();

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Add New Flock
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >

        <input
          placeholder="Flock Name"
          value={flockName}
          onChange={(e) =>
            setFlockName(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
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

          <option>
            Growers
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
          required
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Create Flock"
        />

      </form>

    </div>
  );
}