"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useExpenses } from "@/hooks/useExpenses";

import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";

export default function ExpensesPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    records,
  } = useExpenses(
    farmId
  );

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayExpenses =
    records
      .filter(
        (record) =>
          record.expense_date ===
          today
      )
      .reduce(
        (
          sum,
          record
        ) =>
          sum +
          Number(
            record.amount
          ),
        0
      );

  const totalExpenses =
    records.reduce(
      (
        sum,
        record
      ) =>
        sum +
        Number(
          record.amount
        ),
      0
    );

  const transactionCount =
    records.length;

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-4xl font-bold">
        Expenses Management
      </h1>

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-3
          gap-4
        "
      >
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <p className="text-slate-500 text-sm">
            Today
          </p>

          <p className="text-4xl font-bold mt-2 text-red-600">
            {todayExpenses}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <p className="text-slate-500 text-sm">
            Total Expenses
          </p>

          <p className="text-4xl font-bold mt-2 text-red-600">
            {totalExpenses}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <p className="text-slate-500 text-sm">
            Transactions
          </p>

          <p className="text-4xl font-bold mt-2">
            {transactionCount}
          </p>
        </div>
      </div>

      <ExpenseList
        records={records}
      />

      <AddExpenseForm
        farmId={farmId}
      />

    </div>
  );
}