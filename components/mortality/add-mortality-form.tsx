"use client";

import { useState } from "react";

import {
  createMortality,
} from "@/lib/mortality";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
};

export default function AddMortalityForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
    useState("Disease");

  const [recordDate, setRecordDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  async function handleSave() {
    try {
      if (!flockId) {
        return;
      }

      setLoading(true);

      await createMortality({
        farm_id: farmId,
        flock_id: flockId,
        mortality_date:
          recordDate,
        quantity:
          Number(quantity),
        reason,
      });
      await onSaved?.();

      setQuantity("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Record Mortality
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >

        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
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
          required
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
          <option>
            Disease
          </option>

          <option>
            Heat Stress
          </option>

          <option>
            Predator Attack
          </option>

          <option>
            Injury
          </option>

          <option>
            Culled
          </option>

          <option>
            Feed Poisoning
          </option>

          <option>
            Water Contamination
          </option>

          <option>
            Unknown
          </option>

          <option>
            Other
          </option>
        </select>

        <SaveButton
          loading={loading}
          success={success}
          label="Save Mortality"
        />

      </form>

    </div>
  );
}