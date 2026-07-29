"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useExpenses } from "@/hooks/useExpenses";

import AppShell from "@/components/layout/app-shell";

import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";

export default function ExpensesPage() {
  const { user } =
    useAuth();

  const { farm, loading: farmLoading } = useCurrentFarm();

  const {
    records,
    refresh,
  } = useExpenses(
    farm?.id
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
        (sum, record) =>
          sum +
          Number(record.amount),
        0
      );

  const totalExpenses =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.amount),
      0
    );

  const transactionCount =
    records.length;

  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        <h1 className="text-4xl font-bold">
          Expenses Management
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

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
          farmId={farm?.id}
           onSaved={refresh}
        />

      </div>
    </AppShell>
  );
}