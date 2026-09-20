import {
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { formatCurrency } from "@/lib/currency";

type Props = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  currency?: string;
};

type FinancialRowProps = {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  iconBg: string;
  iconColor: string;
  valueColor: string;
};

function FinancialRow({
  label,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
}: FinancialRowProps) {
  return (
    <div
      className="
        flex
        min-h-0
        flex-1
        items-center
        gap-3
        px-3
        py-2.5
      "
    >
      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          ${iconBg}
        `}
      >
        <Icon
          size={16}
          className={iconColor}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="
            text-sm
            font-medium
            text-slate-900
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[10px]
            text-slate-500
          "
        >
          {description}
        </p>
      </div>

      <p
        className={`
          shrink-0
          text-sm
          font-bold
          tracking-tight
          ${valueColor}
        `}
      >
        {value}
      </p>
    </div>
  );
}

export default function FinancialOverview({
  totalRevenue,
  totalExpenses,
  profit,
  currency,
}: Props) {
  const isProfit = Number(profit) >= 0;

  return (
    <section
      className="
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* Header */}

      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-slate-100
          px-4
          py-3.5
        "
      >
        <div>
          <h2
            className="
              text-sm
              font-semibold
              tracking-tight
              text-slate-900
            "
          >
            Financial Overview
          </h2>

          <p
            className="
              mt-0.5
              text-[10px]
              text-slate-500
            "
          >
            Performance for the selected period
          </p>
        </div>

        <div
          className={`
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            ${
              isProfit
                ? "bg-emerald-50"
                : "bg-red-50"
            }
          `}
        >
          <Wallet
            size={14}
            className={
              isProfit
                ? "text-emerald-600"
                : "text-red-600"
            }
          />
        </div>
      </div>

      {/* Financial rows */}

      <div
        className="
          flex
          flex-1
          flex-col
          divide-y
          divide-slate-100
        "
      >
        <FinancialRow
          label="Revenue"
          value={formatCurrency(
            Number(totalRevenue),
            { currency }
          )}
          description="Income generated"
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          valueColor="text-emerald-600"
        />

        <FinancialRow
          label="Expenses"
          value={formatCurrency(
            Number(totalExpenses),
            { currency }
          )}
          description="Operating costs"
          icon={ReceiptText}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          valueColor="text-red-600"
        />

        <FinancialRow
          label={isProfit ? "Profit" : "Loss"}
          value={formatCurrency(
            Math.abs(Number(profit)),
            { currency }
          )}
          description="Net performance"
          icon={
            isProfit
              ? TrendingUp
              : TrendingDown
          }
          iconBg={
            isProfit
              ? "bg-blue-50"
              : "bg-red-50"
          }
          iconColor={
            isProfit
              ? "text-blue-600"
              : "text-red-600"
          }
          valueColor={
            isProfit
              ? "text-blue-700"
              : "text-red-600"
          }
        />
      </div>
    </section>
  );
}