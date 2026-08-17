"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

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
  const [flockId, setFlockId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
    useState(REASONS[0]);

  const [notes, setNotes] =
    useState("");

  const [isolationDate, setIsolationDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const selectedFlock =
    flocks.find(
      (flock) =>
        flock.id === flockId
    );

  async function handleSave() {
    if (!flockId) {
      alert("Please select a flock.");
      return;
    }

    const isolatedQuantity =
      Number(quantity);

    if (
      !Number.isInteger(
        isolatedQuantity
      ) ||
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
        Number(
          selectedFlock.quantity || 0
        )
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
        isolation_date:
          isolationDate,
        quantity:
          isolatedQuantity,
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
          <Activity
            size={22}
            className="text-amber-600"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Record Isolation
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Move sick birds from their flock
            into isolation.
          </p>
        </div>

      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >

        {/* Isolation Date */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Isolation Date
          </label>

          <input
            type="date"
            value={isolationDate}
            onChange={(e) =>
              setIsolationDate(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Flock */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Flock
          </label>

          <select
            value={flockId}
            onChange={(e) =>
              setFlockId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">
              Select Flock
            </option>

            {flocks.map(
              (flock: any) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.flock_name}
                  {flock.bird_type
                    ? ` — ${flock.bird_type}`
                    : ""}
                </option>
              )
            )}
          </select>
        </div>

        {/* Current flock size */}
        {selectedFlock && (
          <div className="md:col-span-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-blue-800">
                  Available flock balance
                </p>

                <p className="text-xs text-blue-600 mt-0.5">
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

        {/* Birds to isolate */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Birds to Isolate
          </label>

          <input
            type="number"
            min="1"
            step="1"
            placeholder="Number of birds"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Reason for Isolation
          </label>

          <select
            value={reason}
            onChange={(e) =>
              setReason(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option
              value=""
              disabled
            >
              Select reason
            </option>

            {REASONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Notes
          </label>

          <textarea
            placeholder="Optional notes about symptoms, treatment or observations..."
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save */}
        <div className="md:col-span-2">
          <SaveButton
            loading={loading}
            success={success}
            label="Isolate Birds"
          />
        </div>

      </form>
    </div>
  );
}