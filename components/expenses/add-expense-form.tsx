"use client";

import { useState } from "react";

import {
  createExpense,
} from "@/lib/expenses";

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
        amount:
          Number(amount),
        notes,
      });

      setAmount("");
      setNotes("");

      alert(
        "Expense saved successfully"
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Record Expense
      </h2>

      <div className="space-y-4">

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option>Feed</option>
          <option>Medication</option>
          <option>Vaccination</option>
          <option>Transport</option>
          <option>Fuel</option>
          <option>Utilities</option>
          <option>Labour</option>
          <option>Maintenance</option>
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
          className="w-full border rounded-xl p-4"
        />

        <input
          placeholder="Description / Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="
            w-full
            bg-slate-900
            text-white
            rounded-xl
            p-4
          "
        >
          {loading
            ? "Saving..."
            : "Save Expense"}
        </button>

      </div>

    </div>
  );
}