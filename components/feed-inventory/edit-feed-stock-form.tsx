"use client";

import { useState, useEffect } from "react";

import {
  updateFeedStock,
} from "@/lib/feedInventory";

import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

type Props = {
  record: any;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

export default function EditFeedStockForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [feedType, setFeedType] = useState(record.feed_type || "Starter");
  const [quantityKg, setQuantityKg] = useState(record.quantity_kg?.toString() || "");
  const [cost, setCost] = useState(record.cost?.toString() || "");
  const [supplier, setSupplier] = useState(record.supplier || "");
  const [recordDate, setRecordDate] = useState(
    record.purchase_date || new Date().toISOString().split("T")[0]
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
      setLoading(true);

      await updateFeedStock(record.id, {
        purchase_date: recordDate,
        feed_type: feedType,
        quantity_kg: Number(quantityKg),
        cost: Number(cost || 0),
        supplier: supplier,
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
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-2xl font-bold mb-6">
          Edit Feed Stock
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
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-2xl font-bold mb-6">
        Edit Feed Stock
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-3"
      >
        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(e.target.value)
          }
          className="w-full border p-3 rounded"
          required
        />

        <select
          value={feedType}
          onChange={(e) =>
            setFeedType(e.target.value)
          }
          className="w-full border p-3 rounded"
        >
          <option>
            Starter
          </option>

          <option>
            Grower
          </option>

          <option>
            Finisher
          </option>

          <option>
            Layer Mash
          </option>
        </select>

        <input
          type="number"
          placeholder="Quantity (kg)"
          value={quantityKg}
          onChange={(e) =>
            setQuantityKg(e.target.value)
          }
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) =>
            setCost(e.target.value)
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Supplier"
          value={supplier}
          onChange={(e) =>
            setSupplier(e.target.value)
          }
          className="w-full border p-3 rounded"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Update Feed Stock"
        />
      </form>
    </div>
  );
}