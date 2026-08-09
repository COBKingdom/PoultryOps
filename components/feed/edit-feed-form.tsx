"use client";

import { useState, useEffect } from "react";

import {
  updateFeedRecord,
} from "@/lib/feed";

import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

type Props = {
  record: any;
  flocks: any[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

export default function EditFeedForm({
  record,
  flocks,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [flockId, setFlockId] = useState(record.flock_id || "");
  const [feedType, setFeedType] = useState(record.feed_type || "");
  const [quantityKg, setQuantityKg] = useState(record.quantity_kg?.toString() || "");
  const [recordDate, setRecordDate] = useState(
    record.feed_date || new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [governanceError, setGovernanceError] = useState<string | null>(null);

  useEffect(() => {
    // Check Edit Governance on mount
    const governanceResult = canEdit(
      { id: user?.id || "", role: profile?.role || "" },
      record
    );

    if (!governanceResult.allowed) {
      setGovernanceError(governanceResult.reason || "You cannot edit this record at this time.");
      return;
    }
  }, [user, profile, record]);

  async function handleSave() {
    if (governanceError) {
      return;
    }

    try {
      if (!flockId) {
        return;
      }

      setLoading(true);

      await updateFeedRecord(record.id, {
        flock_id: flockId,
        feed_date: recordDate,
        feed_type: feedType,
        quantity_kg: Number(quantityKg),
      });

      await onSaved?.();

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (governanceError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">
          Edit Feed Record
        </h2>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-red-700 text-sm">
            {governanceError}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        Edit Feed Record
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

          {flocks.map((flock: any) => (
            <option
              key={flock.id}
              value={flock.id}
            >
              {flock.flock_name}
            </option>
          ))}
        </select>

        <select
          value={feedType}
          onChange={(e) =>
            setFeedType(e.target.value)
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
            setQuantityKg(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Update Feed"
        />
      </form>
    </div>
  );
}