"use client";

import { useEffect, useState } from "react";

import { createHealthRecord } from "@/lib/health";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId?: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
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

export default function AddHealthForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [flockId, setFlockId] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [category, setCategory] = useState("Vaccine");

  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"ml" | "g">("ml");
  const [unitPrice, setUnitPrice] = useState("");

  const [notes, setNotes] = useState("");

  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalPrice =
    quantity && unitPrice
      ? Number(quantity) * Number(unitPrice)
      : 0;

  useEffect(() => {
    if (category === "Others (Specify)" && !treatmentName) {
      // Treatment name remains user-entered for Others (Specify).
    }
  }, [category, treatmentName]);

  async function handleSave() {
    try {
      if (!farmId) {
        console.error("Farm ID is required.");
        return;
      }

      if (!flockId) {
        console.error("Flock is required.");
        return;
      }

      if (!treatmentName.trim()) {
        console.error("Treatment name is required.");
        return;
      }

      setLoading(true);

      const calculatedTotal =
        quantity && unitPrice
          ? Number(quantity) * Number(unitPrice)
          : 0;

      await createHealthRecord({
        farm_id: farmId,
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

      setFlockId("");
      setTreatmentName("");
      setCategory("Vaccine");
      setQuantity("");
      setQuantityUnit("ml");
      setUnitPrice("");
      setNotes("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving health record:", error);
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
        {/* Date */}
        <input
          type="date"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          className="w-full border rounded-xl p-4"
          required
        />

        {/* Flock */}
        <select
          value={flockId}
          onChange={(e) => setFlockId(e.target.value)}
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
          label="Save Health Record"
        />
      </form>
    </div>
  );
}