"use client";

import { useState } from "react";

import {
  createHealthRecord,
} from "@/lib/health";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
};

export default function AddHealthForm({
  farmId,
  flocks,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [treatmentName, setTreatmentName] =
    useState("");

  const [category, setCategory] =
    useState("Vaccine");

  const [cost, setCost] =
    useState("");

  const [notes, setNotes] =
    useState("");

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

      await createHealthRecord({
        farm_id: farmId,
        flock_id: flockId,
        health_date:
          new Date()
            .toISOString()
            .split("T")[0],
        treatment_name:
          treatmentName,
        category,
        cost:
          Number(cost || 0),
        notes,
      });

      setTreatmentName("");
      setCost("");
      setNotes("");

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
        Record Health Activity
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >

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
          placeholder="Treatment Name"
          value={treatmentName}
          onChange={(e) =>
            setTreatmentName(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option>
            Vaccine
          </option>

          <option>
            Antibiotic
          </option>

          <option>
            Vitamin
          </option>

          <option>
            Supplement
          </option>

          <option>
            Treatment
          </option>

          <option>
            Deworming
          </option>

          <option>
            Biosecurity
          </option>

          <option>
            Disinfectant
          </option>

          <option>
            Health Inspection
          </option>
        </select>

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) =>
            setCost(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Save Health Record"
        />

      </form>

    </div>
  );
}