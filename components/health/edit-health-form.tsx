"use client";

import { useEffect, useState } from "react";

import { updateHealth } from "@/lib/health";
import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

import { X } from "lucide-react";

type Props = {
  record: any;
  flocks: any[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

const HEALTH_CATEGORIES = [
  "Vaccine",
  "Antibiotic",
  "Vitamin",
  "Multivitamin",
  "Supplement",
  "Treatment",
  "Dewormer",
  "Others (Specify)",
];

export default function EditHealthForm({
  record,
  flocks,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [flockId, setFlockId] = useState(record.flock_id || "");
  const [treatmentName, setTreatmentName] = useState(
    record.treatment_name || ""
  );
  const [category, setCategory] = useState(
    record.category || "Vaccine"
  );

  const [quantity, setQuantity] = useState(
    record.quantity != null
      ? String(record.quantity)
      : ""
  );

  const [quantityUnit, setQuantityUnit] = useState<"ml" | "g">(
    record.quantity_unit === "g" ? "g" : "ml"
  );

  const [unitPrice, setUnitPrice] = useState(
    record.unit_price != null
      ? String(record.unit_price)
      : ""
  );

  const [notes, setNotes] = useState(
    record.notes || ""
  );

  const [recordDate, setRecordDate] = useState(
    record.health_date ||
      new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [governanceError, setGovernanceError] =
    useState<string | null>(null);

  const totalPrice =
    quantity && unitPrice
      ? Number(quantity) * Number(unitPrice)
      : 0;

  useEffect(() => {
    // Check Edit Governance on mount
    const governanceResult = canEdit(
      {
        id: user?.id || "",
        role: profile?.role || "",
      },
      record
    );

    if (!governanceResult.allowed) {
      setGovernanceError(
        governanceResult.reason ||
          "You cannot edit this record at this time."
      );
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

      if (!treatmentName.trim()) {
        return;
      }

      setLoading(true);

      const calculatedTotal =
        quantity && unitPrice
          ? Number(quantity) * Number(unitPrice)
          : 0;

      await updateHealth(record.id, {
        flock_id: flockId,
        health_date: recordDate,
        treatment_name: treatmentName.trim(),
        category,

        quantity:
          quantity !== ""
            ? Number(quantity)
            : null,

        quantity_unit:
          quantity !== ""
            ? quantityUnit
            : null,

        unit_price:
          unitPrice !== ""
            ? Number(unitPrice)
            : null,

        total_price: calculatedTotal,
        cost: calculatedTotal,

        notes: notes.trim() || null,
      });

      await onSaved?.();

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating health record:", error);
    } finally {
      setLoading(false);
    }
  }

  if (governanceError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Edit Health Record
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
          Edit Health Record
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
        {/* Date */}
        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        {/* Flock */}
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

        {/* Treatment Name */}
        <input
          placeholder={
            category === "Others (Specify)"
              ? "Specify Treatment / Health Activity"
              : "Treatment Name"
          }
          value={treatmentName}
          onChange={(e) =>
            setTreatmentName(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        >
          {HEALTH_CATEGORIES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            className="w-full border rounded-xl p-4"
          />

          <select
            value={quantityUnit}
            onChange={(e) =>
              setQuantityUnit(
                e.target.value as "ml" | "g"
              )
            }
            className="w-full border rounded-xl p-4"
          >
            <option value="ml">
              Millilitres (ml)
            </option>
            <option value="g">
              Grams (g)
            </option>
          </select>
        </div>

        {/* Unit Price */}
        <input
          type="number"
          min="0"
          step="any"
          placeholder={
            quantityUnit === "ml"
              ? "Unit Price per ml"
              : "Unit Price per gram"
          }
          value={unitPrice}
          onChange={(e) =>
            setUnitPrice(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        {/* Total Price */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Total Price
          </p>

          <p className="text-xl font-bold text-slate-900 mt-1">
            {totalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {quantity && unitPrice && (
            <p className="text-xs text-slate-500 mt-1">
              {Number(quantity).toLocaleString()}{" "}
              {quantityUnit} ×{" "}
              {Number(unitPrice).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}{" "}
              per {quantityUnit}
            </p>
          )}
        </div>

        {/* Notes */}
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
          label="Update Health Record"
        />
      </form>
    </div>
  );
}