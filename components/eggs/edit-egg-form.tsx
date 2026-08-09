"use client";

import { useState, useEffect } from "react";

import {
  updateEggProduction,
} from "@/lib/eggs";

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

export default function EditEggForm({
  record,
  flocks,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [flockId, setFlockId] = useState(record.flock_id || "");
  const [eggCount, setEggCount] = useState(record.egg_count?.toString() || "");
  const [crackedEggs, setCrackedEggs] = useState(
    record.cracked_eggs?.toString() || "0"
  );
  const [recordDate, setRecordDate] = useState(
    record.production_date || new Date().toISOString().split("T")[0]
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

      await updateEggProduction(record.id, {
        flock_id: flockId,
        production_date: recordDate,
        egg_count: Number(eggCount),
        cracked_eggs: Number(crackedEggs || 0),
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
          Edit Egg Production
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
        Edit Egg Production
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

        <input
          type="number"
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
          label="Update Production"
        />
      </form>
    </div>
  );
}