"use client";

import { useState } from "react";

import { createExpense } from "@/lib/expenses";

type Props = {
  farmId: string;
};

export default function AddExpenseForm({
  farmId,
}: Props) {
  const [category, setCategory] =
    useState("Feed");

  const [amount, setAmount] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      await createExpense({
        farm_id: farmId,
        expense_date:
          new Date()
            .toISOString()
            .split("T")[0],
        category,
        amount: Number(amount),
        notes,
      });

      setAmount("");
      setNotes("");

      alert(
        "Expense saved"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save expense"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Record Expense
      </h2>

      <div className="space-y-3">

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>Feed</option>
          <option>Medication</option>
          <option>Fuel</option>
          <option>Transport</option>
          <option>Utilities</option>
          <option>Labour</option>
          <option>Other</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) =>
            setAmount(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-slate-900 text-white p-3 rounded"
        >
          {loading
            ? "Saving..."
            : "Save Expense"}
        </button>

      </div>
    </div>
  );
}