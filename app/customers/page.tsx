"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CreditCard,
  Plus,
  Users,
  WalletCards,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import {
  CustomerBalance,
  CustomerSaleBalance,
  getCustomer,
  getCustomerSales,
} from "@/lib/customers";

import {
  getCustomerPayments,
  CustomerPayment,
} from "@/lib/customer-payments";

import {
  getFarmFlocks,
} from "@/lib/flocks";

import AppShell from "@/components/layout/app-shell";

import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import CustomerForm from "@/components/customers/customer-form";
import CustomerList from "@/components/customers/customer-list";
import DebtorsList from "@/components/customers/debtors-list";
import CustomerAccount from "@/components/customers/customer-account";
import AcceptPaymentForm from "@/components/customers/accept-payment-form";

import { useCustomers } from "@/hooks/useCustomers";

export default function CustomersPage() {
  const { profile } = useAuth();

  const {
    data: dashboardData,
  } = useDashboard();

  const dashboard: any =
    dashboardData || {};

  const farmId =
    profile?.farm_id ||
    dashboard?.farm?.id ||
    dashboard?.farmId ||
    "";

  const currency =
    dashboard?.farm?.currency ||
    dashboard?.currency ||
    "NGN";

  const {
    records,
    loading,
    error,
    refresh,
  } = useCustomers(farmId);

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<
      "registry" | "debtors"
    >("registry");

  const [showCustomerForm, setShowCustomerForm] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerBalance | null>(
      null
    );

  const [accountSales, setAccountSales] =
    useState<CustomerSaleBalance[]>([]);

  const [accountPayments, setAccountPayments] =
    useState<CustomerPayment[]>([]);

  const [accountLoading, setAccountLoading] =
    useState(false);

  const [paymentCustomer, setPaymentCustomer] =
    useState<CustomerBalance | null>(
      null
    );

  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [flockFilter, setFlockFilter] =
    useState("");

  const [page, setPage] =
    useState(1);

  const pageSize = 10;

  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) {
        setFlocks([]);
        return;
      }

      try {
        const result =
          await getFarmFlocks(
            farmId
          );

        setFlocks(
          result || []
        );
      } catch (err) {
        console.error(
          "Failed to load flocks:",
          err
        );
      }
    }

    loadFlocks();
  }, [farmId]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    activeTab,
    flockFilter,
  ]);

  const filteredCustomers =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return records;
      }

      return records.filter(
        (customer) =>
          customer.name
            ?.toLowerCase()
            .includes(term) ||
          customer.customer_code
            ?.toLowerCase()
            .includes(term) ||
          customer.phone
            ?.toLowerCase()
            .includes(term) ||
          customer.location
            ?.toLowerCase()
            .includes(term)
      );
    }, [
      records,
      search,
    ]);

  const debtors =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return records
        .filter(
          (customer) =>
            Number(
              customer.outstanding_balance || 0
            ) > 0
        )
        .filter((customer) => {
          if (!term) {
            return true;
          }

          return (
            customer.name
              ?.toLowerCase()
              .includes(term) ||
            customer.customer_code
              ?.toLowerCase()
              .includes(term) ||
            customer.phone
              ?.toLowerCase()
              .includes(term) ||
            customer.location
              ?.toLowerCase()
              .includes(term)
          );
        });
    }, [
      records,
      search,
    ]);

  const visibleRecords =
    activeTab === "registry"
      ? filteredCustomers
      : debtors;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        visibleRecords.length /
          pageSize
      )
    );

  const paginatedRecords =
    visibleRecords.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  const totalCustomers =
    records.length;

  const activeCustomers =
    records.filter(
      (customer) =>
        customer.active
    ).length;

  const debtorCount =
    records.filter(
      (customer) =>
        Number(
          customer.outstanding_balance || 0
        ) > 0
    ).length;

  const totalReceivables =
    records.reduce(
      (sum, customer) =>
        sum +
        Number(
          customer.outstanding_balance || 0
        ),
      0
    );

  async function openAccount(
    customer: CustomerBalance
  ) {
    if (!farmId) {
      return;
    }

    try {
      setAccountLoading(true);

      setSelectedCustomer(
        customer
      );

      const [
        sales,
        payments,
      ] = await Promise.all([
        getCustomerSales(
          farmId,
          customer.customer_id
        ),
        getCustomerPayments(
          farmId,
          customer.customer_id
        ),
      ]);

      setAccountSales(
        sales
      );

      setAccountPayments(
        payments
      );

    } catch (err) {
      console.error(
        "Failed to load customer account:",
        err
      );

      alert(
        "Unable to load the customer account."
      );

      setSelectedCustomer(
        null
      );

    } finally {
      setAccountLoading(false);
    }
  }

  function openPayment(
    customer?: CustomerBalance
  ) {
    setPaymentCustomer(
      customer || null
    );

    setShowPaymentForm(
      true
    );
  }

  async function handlePaymentSaved() {
    await refresh();

    if (
      selectedCustomer &&
      farmId
    ) {
      try {
        const [
          customer,
          sales,
          payments,
        ] = await Promise.all([
          getCustomer(
            farmId,
            selectedCustomer.customer_id
          ),
          getCustomerSales(
            farmId,
            selectedCustomer.customer_id
          ),
          getCustomerPayments(
            farmId,
            selectedCustomer.customer_id
          ),
        ]);

        if (customer) {
          setSelectedCustomer(
            customer
          );
        }

        setAccountSales(
          sales
        );

        setAccountPayments(
          payments
        );

      } catch (err) {
        console.error(
          "Failed to refresh customer account:",
          err
        );
      }
    }
  }

  if (selectedCustomer) {
    return (
      <AppShell>

        <div className="p-6">

          {accountLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Loading customer account...
              </p>
            </div>
          ) : (
            <CustomerAccount
              customer={
                selectedCustomer
              }
              sales={
                accountSales
              }
              payments={
                accountPayments
              }
              currency={
                currency
              }
              onBack={() =>
                setSelectedCustomer(
                  null
                )
              }
              onAcceptPayment={() =>
                openPayment(
                  selectedCustomer
                )
              }
              onPaymentCorrected={handlePaymentSaved}
            />
          )}

          {showPaymentForm && (
            <AcceptPaymentForm
              customers={
                records.filter(
                  (customer) =>
                    Number(
                      customer.outstanding_balance || 0
                    ) > 0
                )
              }
              initialCustomer={
                paymentCustomer
              }
              currency={
                currency
              }
              onClose={() =>
                setShowPaymentForm(
                  false
                )
              }
              onSaved={
                handlePaymentSaved
              }
            />
          )}

        </div>

      </AppShell>
    );
  }

  return (
    <AppShell>

      <div className="space-y-6 p-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer accounts, debtors and payments.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowCustomerForm(
                true
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Customer
          </button>

        </div>

        {/* KPI CARDS */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <OperationsKpiCard
            label="Customers"
            value={
              totalCustomers
            }
            sublabel="Registered customers"
            icon={
              <Users size={20} />
            }

          />

          <OperationsKpiCard
            label="Active"
            value={
              activeCustomers
            }
            sublabel="Active customer accounts"
            icon={
              <Users size={20} />
            }

          />

          <OperationsKpiCard
            label="Debtors"
            value={
              debtorCount
            }
            sublabel="Customers with outstanding balances"
            icon={
              <CreditCard size={20} />
            }

          />

          <OperationsKpiCard
            label="Receivables"
            value={
              totalReceivables
            }
            sublabel="Total customer outstanding"
            icon={
              <WalletCards size={20} />
            }

            currency={
              currency
            }
          />

        </div>

        {/* TABS */}

        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "registry"
              )
            }
            className={`
              rounded-lg px-4 py-2.5 text-sm font-semibold transition
              ${
                activeTab === "registry"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            Customer Registry
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "debtors"
              )
            }
            className={`
              rounded-lg px-4 py-2.5 text-sm font-semibold transition
              ${
                activeTab === "debtors"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            Debtors

            {debtorCount > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                {debtorCount}
              </span>
            )}

          </button>

        </div>

        {/* TOOLBAR */}

        <OperationsToolbar
          searchValue={
            search
          }
          onSearchChange={
            setSearch
          }
          searchPlaceholder={
            activeTab === "registry"
              ? "Search customers by name, code, phone or location..."
              : "Search debtors by name, code or phone..."
          }
        >

          <select
            value={
              flockFilter
            }
            onChange={(e) =>
              setFlockFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">
              All Flocks
            </option>

            {flocks.map(
              (flock: any) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.flock_name}
                </option>
              )
            )}

          </select>

        </OperationsToolbar>

        {/* FILTER INFORMATION */}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          The customer registry and debtor balances show current account totals. Transaction-level flock and date filtering will be applied within customer account history.
        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CONTENT */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading customers...
            </p>
          </div>
        ) : activeTab === "registry" ? (
          <CustomerList
            records={
              paginatedRecords
            }
            currency={
              currency
            }
            onView={
              openAccount
            }
          />
        ) : (
          <DebtorsList
            records={
              paginatedRecords
            }
            currency={
              currency
            }
            onViewAccount={
              openAccount
            }
            onAcceptPayment={
              openPayment
            }
          />
        )}

        {/* PAGINATION */}

        {visibleRecords.length >
          pageSize && (
<OperationsPagination
  current={page}
  total={totalPages}
  onPageChange={setPage}
/>
        )}

      </div>

      {/* ADD CUSTOMER */}

      {showCustomerForm && (
        <CustomerForm
          farmId={
            farmId
          }
          onSaved={
            refresh
          }
          onClose={() =>
            setShowCustomerForm(
              false
            )
          }
        />
      )}

      {/* ACCEPT PAYMENT */}

      {showPaymentForm && (
        <AcceptPaymentForm
          customers={
            records.filter(
              (customer) =>
                Number(
                  customer.outstanding_balance || 0
                ) > 0
            )
          }
          initialCustomer={
            paymentCustomer
          }
          currency={
            currency
          }
          onClose={() =>
            setShowPaymentForm(
              false
            )
          }
          onSaved={
            handlePaymentSaved
          }
        />
      )}

    </AppShell>
  );
}
