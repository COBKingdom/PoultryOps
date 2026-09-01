"use client";

import { useState } from "react";

import { createExpense } from "@/lib/expenses";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId?: string;
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
  "Others (Specify)",
];

export default function AddExpenseForm({
  farmId,
  onSaved,
}: Props) {
  const [category, setCategory] = useState("Staff Salaries");

  const [amount, setAmount] = useState("");

  const [notes, setNotes] = useState("");

  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

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

      setLoading(true);

      await createExpense({
        farm_id: farmId,
        expense_date: recordDate,
        category,
        amount: Number(amount),
        notes: notes.trim() || null,
      });

      await onSaved?.();

      setAmount("");
      setNotes("");

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
          onChange={(e) =>
            setCategory(e.target.value)
          }
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