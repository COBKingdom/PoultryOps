"use client";

import { useState } from "react";

import {
  createExpense,
} from "@/lib/expenses";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId?: string;
  onSaved?: () => Promise<void> | void;
  
};

export default function AddExpenseForm({
  farmId,
  onSaved,
}: Props) {
  const [category, setCategory] =
    useState("Staff Salaries");

  const [amount, setAmount] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [recordDate, setRecordDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      await createExpense({
        farm_id: farmId,
        expense_date:
          recordDate,
        category,
        amount:
          Number(amount),
        notes,
      });
      await onSaved?.();

      setAmount("");
      setNotes("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);

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

        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option>
            Staff Salaries
          </option>

          <option>
            Transportation
          </option>

          <option>
            Fuel & Generator
          </option>

          <option>
            Electricity
          </option>

          <option>
            Water Supply
          </option>

          <option>
            Maintenance & Repairs
          </option>

          <option>
            Equipment Purchase
          </option>

          <option>
            Marketing
          </option>

          <option>
            Professional Services
          </option>

          <option>
            Miscellaneous
          </option>
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
          required
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

        <SaveButton
          loading={loading}
          success={success}
          label="Save Expense"
        />

      </form>

    </div>
  );
}