"use client";

import { useState } from "react";

import { createExpense } from "@/lib/expenses";

import SaveButton from "@/components/ui/save-button";

type Flock = {
  id: string;
  flock_name: string;
  bird_type?: string | null;
};

type Props = {
  farmId?: string;
  flocks?: Flock[];
  onSaved?: () => Promise<void> | void;
};

const EXPENSE_CATEGORIES = [
  "Staff Salaries",
  "Transportation",
  "Fuel & Generator",
  "Gas Bills",
  "Electricity",
  "Water Supply",
  "Litter/Bedding",
  "Maintenance & Repairs",
  "Equipment Purchase",
  "Marketing & Advert",
  "Internet Subscription",
  "Office Stationery",
  "Professional Services",
  "Association Dues",
  "Deworming",
  "Biosecurity",
  "Cleaning Disinfectant",
  "Health Inspection",
  "Bird Purchase",
  "Others (Specify)",
];

const BIRD_PURCHASE_TYPES = [
  "Broiler",
  "Noiler",
  "Kuroiler",
  "Brahma",
  "White Cockerel",
  "Black Cockerel",
  "Brown Pullets (Layers)",
  "Black Pullet (Layers)",
  "Local Turkey",
  "Foreign Turkey",
  "Foreign Guinea Fowl",
  "Local Guinea Fowl",
  "Local Duck",
  "Foreign Duck",
];

export default function AddExpenseForm({
  farmId,
  flocks = [],
  onSaved,
}: Props) {
  const [category, setCategory] = useState("Staff Salaries");
  const [flockId, setFlockId] = useState("");
  const [birdType, setBirdType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isBirdPurchase = category === "Bird Purchase";

  async function handleSave() {
    try {
      if (!farmId) {
        console.error("Farm ID is required.");
        return;
      }

      if (!amount || Number(amount) < 0) {
        console.error("A valid expense amount is required.");
        return;
      }

      if (isBirdPurchase) {
        if (!flockId) {
          console.error(
            "Please select the flock for the bird purchase."
          );
          return;
        }

        if (!birdType) {
          console.error(
            "Please select the bird purchase type."
          );
          return;
        }

        if (!quantity || Number(quantity) <= 0) {
          console.error(
            "Please enter a valid bird quantity."
          );
          return;
        }
      }

      setLoading(true);

      await createExpense({
        farm_id: farmId,
        expense_date: recordDate,
        category,
        amount: Number(amount),
        notes: notes.trim() || null,
        flock_id: flockId || null,
        bird_type: isBirdPurchase
          ? birdType
          : null,
        quantity: isBirdPurchase
          ? Number(quantity)
          : null,
      });

      await onSaved?.();

      setAmount("");
      setNotes("");
      setFlockId("");
      setBirdType("");
      setQuantity("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving expense:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        Record Expense
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
          onChange={(e) =>
            setRecordDate(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => {
            const value = e.target.value;

            setCategory(value);

            if (value !== "Bird Purchase") {
              setBirdType("");
              setQuantity("");
            }
          }}
          className="w-full border rounded-xl p-4"
          required
        >
          {EXPENSE_CATEGORIES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* Flock */}
        <select
          value={flockId}
          onChange={(e) =>
            setFlockId(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        >
          <option value="">
            {isBirdPurchase
              ? "Select Flock"
              : "Farm-wide Expense (No Flock)"}
          </option>

          {flocks.map((flock) => (
            <option
              key={flock.id}
              value={flock.id}
            >
              {flock.flock_name}
              {flock.bird_type
                ? ` — ${flock.bird_type}`
                : ""}
            </option>
          ))}
        </select>

        {/* Bird Purchase Fields */}
        {isBirdPurchase && (
          <>
            {/* Bird / Purchase Type */}
            <select
              value={birdType}
              onChange={(e) =>
                setBirdType(e.target.value)
              }
              className="w-full border rounded-xl p-4"
              required
            >
              <option value="">
                Select Bird / Purchase Type
              </option>

              {BIRD_PURCHASE_TYPES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* Quantity */}
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Quantity of Birds"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              className="w-full border rounded-xl p-4"
              required
            />
          </>
        )}

        {/* Amount */}
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        {/* Notes */}
        <input
          placeholder="Description / Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Save Expense"
        />
      </form>
    </div>
  );
}