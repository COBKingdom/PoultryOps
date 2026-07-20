"use client";

import { useEffect, useState } from "react";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flock?: any | null;
  onSave: (values: any) => Promise<void>;
  onCancel: () => void;
};

export default function AddFlockForm({
  flock,
  onSave,
  onCancel,
}: Props) {
  const [flockName, setFlockName] = useState("");
  const [birdType, setBirdType] = useState("Layers");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (flock) {
      setFlockName(
        flock.flock_name ?? ""
      );

      setBirdType(
        flock.bird_type ?? "Layers"
      );

      setQuantity(
        String(
          flock.quantity ?? ""
        )
      );
    } else {
      resetForm();
    }
  }, [flock]);

  function resetForm() {
    setFlockName("");
    setBirdType("Layers");
    setQuantity("");
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await onSave({
        flock_name: flockName,
        bird_type: birdType,
        quantity: Number(quantity),
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 1800);

      if (!flock) {
        resetForm();
      }

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">

        <h2 className="text-2xl font-bold text-slate-900">

          {flock
            ? "Edit Flock"
            : "Add New Flock"}

        </h2>

        <p className="mt-1 text-sm text-slate-500">

          {flock
            ? "Update your flock information."
            : "Register a new poultry flock."}

        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6"
      >

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Flock Name
          </label>

          <input
            type="text"
            value={flockName}
            onChange={(e) =>
              setFlockName(
                e.target.value
              )
            }
            placeholder="e.g. Layer House A"
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
            "
            required
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Bird Type
          </label>

          <select
            value={birdType}
            onChange={(e) =>
              setBirdType(
                e.target.value
              )
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
            "
          >

            <option value="Layers">
              Layers
            </option>

            <option value="Broilers">
              Broilers
            </option>

            <option value="Growers">
              Growers
            </option>

            <option value="Cockerels">
              Cockerels
            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Number of Birds
          </label>

          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            placeholder="Enter bird quantity"
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              transition
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
            "
            required
          />

        </div>

        <div className="flex flex-wrap gap-3 pt-2">

          <SaveButton
            loading={loading}
            success={success}
            label={
              flock
                ? "Update Flock"
                : "Create Flock"
            }
          />

          {flock && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                onCancel();
              }}
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                px-6
                py-3
                font-medium
                text-slate-700
                transition
                hover:bg-slate-100
              "
            >
              Cancel
            </button>
          )}

        </div>

      </form>

    </div>
  );
}