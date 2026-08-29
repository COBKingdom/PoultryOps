"use client";

import { useState } from "react";

import {
  createEggProduction,
} from "@/lib/eggs";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId?: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
  user?: any;
};

export default function AddEggForm({
  farmId,
  flocks,
  onSaved,
  user,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [eggCount, setEggCount] =
    useState("");

  const [crackedEggs, setCrackedEggs] =
    useState("");

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
      if (!farmId || !flockId) {
        return;
      }

      setLoading(true);

      await createEggProduction({
        farm_id: farmId,
        flock_id: flockId,
        production_date: recordDate,
        egg_count: Number(eggCount),
        cracked_eggs: Number(
          crackedEggs || 0
        ),
        created_by: user?.id ?? null,
      });

      await onSaved?.();

      setEggCount("");
      setCrackedEggs("");

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
        Record Egg Production
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
            setRecordDate(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(e.target.value)
          }
          className="w-full border rounded-xl p-4"
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
              </option>
            )
          )}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Egg Count"
          value={eggCount}
          onChange={(e) =>
            setEggCount(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <input
          type="number"
          min="0"
          placeholder="Cracked Eggs"
          value={crackedEggs}
          onChange={(e) =>
            setCrackedEggs(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Save Production"
        />

      </form>

    </div>
  );
}