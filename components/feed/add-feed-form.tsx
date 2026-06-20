"use client";

import { useState } from "react";

import {
  createFeedRecord,
} from "@/lib/feed";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
};

export default function AddFeedForm({
  farmId,
  flocks,
   onSaved,
}: Props) {
  const [flockId, setFlockId] =
    useState("");

  const [feedType, setFeedType] =
    useState("");

  const [quantityKg, setQuantityKg] =
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
      if (!flockId) {
        return;
      }

      setLoading(true);

      await createFeedRecord({
        farm_id: farmId,
        flock_id: flockId,
        feed_date:
          recordDate,
        feed_type:
          feedType,
        quantity_kg:
          Number(
            quantityKg
          ),
      });
      await onSaved?.();

      setFeedType("");
      setQuantityKg("");

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
        Record Feed
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

        <select
          value={feedType}
          onChange={(e) =>
            setFeedType(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        >
          <option value="">
            Select Feed Type
          </option>

          <option>
            Starter Feed
          </option>

          <option>
            Grower Feed
          </option>

          <option>
            Layer Mash
          </option>

          <option>
            Broiler Starter
          </option>

          <option>
            Broiler Finisher
          </option>

          <option>
            Concentrate
          </option>

          <option>
            Supplement
          </option>

          <option>
            Other
          </option>
        </select>

        <input
          type="number"
          placeholder="Quantity (kg)"
          value={quantityKg}
          onChange={(e) =>
            setQuantityKg(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Save Feed"
        />

      </form>

    </div>
  );
}