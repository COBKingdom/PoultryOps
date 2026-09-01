"use client";

import { useState, useEffect } from "react";

import { updateExpense } from "@/lib/expenses";

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

export default function EditExpenseForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [expenseDate, setExpenseDate] = useState(
    record.expense_date ||
      new Date().toISOString().split("T")[0]
  );

  const [category, setCategory] = useState(
    record.category || "Miscellaneous"
  );

  const [amount, setAmount] = useState(
    record.amount?.toString() || ""
  );

  const [notes, setNotes] = useState(
    record.notes || ""
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [governanceError, setGovernanceError] =
    useState<string | null>(null);

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
      return;
    }
  }, [user, profile, record]);

  async function handleSave() {
    if (governanceError) {
      return;
    }

    try {
      if (!amount || Number(amount) < 0) {
        return;
      }

      setLoading(true);

      await updateExpense(record.id, {
        expense_date: expenseDate,
        category: category,
        amount: Number(amount),
        notes: notes.trim() || null,
      });

      await onSaved?.();

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating expense:", error);
    } finally {
      setLoading(false);
    }
  }

  if (governanceError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Edit Expense
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
          Edit Expense
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
          value={expenseDate}
          onChange={(e) =>
            setExpenseDate(e.target.value)
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