"use client";

import { useState } from "react";

import { createIsolation } from "@/lib/isolation";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
};

/*
 * Disease-specific reasons are intentionally
 * listed first because these are the most useful
 * operational reasons for poultry isolation.
 *
 * General reasons are preserved underneath.
 */
const REASONS = [
  "Newcastle Disease",
  "Infectious Bursal Disease",
  "Bird Flu (Avian Influenza)",
  "Coccidiosis",
  "Fowl Pox",
  "Fowl Typhoid",
  "Fowl Cholera",
  "Marek's Disease",
  "Infectious Coryza",

  "Respiratory Symptoms",
  "Digestive Symptoms",
  "Injury",
  "Weak / Unthrifty",
  "Suspected Infection",
  "Observation",
  "Other",
];

export default function AddIsolationForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [flockId, setFlockId] = useState("");

  const [quantity, setQuantity] = useState("");

  const [reason, setReason] = useState(REASONS[0]);

  const [notes, setNotes] = useState("");

  const [isolationDate, setIsolationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const selectedFlock = flocks.find(
    (flock) => flock.id === flockId
  );

  async function handleSave() {
    if (!flockId) {
      alert("Please select a flock.");
      return;
    }

    const isolatedQuantity = Number(quantity);

    if (
      !Number.isInteger(isolatedQuantity) ||
      isolatedQuantity <= 0
    ) {
      alert(
        "Please enter a valid whole number of birds."
      );
      return;
    }

    if (
      selectedFlock &&
      isolatedQuantity >
        Number(selectedFlock.quantity || 0)
    ) {
      alert(
        "The isolation quantity cannot exceed the current flock quantity."
      );
      return;
    }

    try {
      setLoading(true);

      await createIsolation({
        farm_id: farmId,
        flock_id: flockId,
        isolation_date: isolationDate,
        quantity: isolatedQuantity,
        reason,
        notes,
      });

      await onSaved?.();

      setFlockId("");
      setQuantity("");
      setReason(REASONS[0]);
      setNotes("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error(
        "Failed to create isolation record:",
        error
      );

      alert(
        error?.message ||
          "Failed to record isolation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Record Isolation
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        {/* Isolation Date */}
        <input
          type="date"
          value={isolationDate}
          onChange={(e) =>
            setIsolationDate(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Flock */}
        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {flock.bird_type
                ? ` — ${flock.bird_type}`
                : ""}
            </option>
          ))}
        </select>

        {/* Current flock balance */}
        {selectedFlock && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Available flock balance
                </p>

                <p className="mt-0.5 text-xs text-blue-600">
                  Birds currently recorded in this flock
                </p>
              </div>

              <span className="font-bold text-blue-900">
                {Number(
                  selectedFlock.quantity || 0
                ).toLocaleString()}{" "}
                birds
              </span>
            </div>
          </div>
        )}

        {/* Birds to Isolate */}
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Number of birds"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Reason */}
        <select
          value={reason}
          onChange={(e) =>
            setReason(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="" disabled>
            Select reason
          </option>

          {REASONS.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* Notes */}
        <textarea
          placeholder="Optional notes about symptoms, treatment or observations..."
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Save */}
        <SaveButton
          loading={loading}
          success={success}
          label="Isolate Birds"
        />
      </form>
    </div>
  );
}