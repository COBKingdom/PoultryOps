"use client";

import { useState, useEffect } from "react";

import {
  updateSale,
} from "@/lib/sales";

import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

import { X } from "lucide-react";

type Props = {
  record: any;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

export default function EditSaleForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [recordDate, setRecordDate] = useState(record.sale_date || new Date().toISOString().split("T")[0]);
  const [itemType, setItemType] = useState(record.item_type || "Egg Sales");
  const [quantity, setQuantity] = useState(record.quantity?.toString() || "");
  const [unitPrice, setUnitPrice] = useState(record.unit_price?.toString() || "");
  const [notes, setNotes] = useState(record.notes || "");
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

      const totalAmount = Number(quantity || 0) * Number(unitPrice || 0);

      await updateSale(record.id, {
        sale_date: recordDate,
        item_type: itemType,
        quantity: Number(quantity || 0),
        unit_price: Number(unitPrice || 0),
        total_amount: totalAmount,
        notes: notes,
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Edit Sale
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Edit Sale
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

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
          value={itemType}
          onChange={(e) =>
            setItemType(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        >
          <option>Egg Sales</option>
          <option>Live Bird Sales</option>
          <option>Spent Layer Sales</option>
          <option>Broiler Sales</option>
          <option>Cockerel Sales</option>
          <option>Manure Sales</option>
          <option>Feed Sales</option>
          <option>Equipment Sales</option>
          <option>Other Income</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <input
          type="number"
          placeholder="Unit Price"
          value={unitPrice}
          onChange={(e) =>
            setUnitPrice(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Update Sale"
        />
      </form>
    </div>
  );
}