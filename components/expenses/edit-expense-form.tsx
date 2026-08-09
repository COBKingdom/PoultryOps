"use client";

import { useState, useEffect } from "react";

import {
  updateExpense,
} from "@/lib/expenses";

import { canEdit } from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

type Props = {
  record: any;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

export default function EditExpenseForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [expenseDate, setExpenseDate] = useState(record.expense_date || new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(record.category || "Feed");
  const [amount, setAmount] = useState(record.amount?.toString() || "");
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

      await updateExpense(record.id, {
        expense_date: expenseDate,
        category: category,
        amount: Number(amount || 0),
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
        <h2 className="text-2xl font-bold mb-6">
          Edit Expense
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
        Edit Expense
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
          value={expenseDate}
          onChange={(e) =>
            setExpenseDate(e.target.value)
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="w-full border rounded-xl p-4"
        >
          <option>Feed</option>
          <option>Medication</option>
          <option>Equipment</option>
          <option>Labor</option>
          <option>Utilities</option>
          <option>Maintenance</option>
          <option>Transportation</option>
          <option>Other</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
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
          label="Update Expense"
        />
      </form>
    </div>
  );
}