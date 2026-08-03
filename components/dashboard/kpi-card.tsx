import {
  Bird,
  Egg,
  TrendingUp,
  ReceiptText,
  Wallet,
  Activity,
} from "lucide-react";

import {
  formatCurrency,
} from "@/lib/currency";

type Props = {
  title: string;
  value: string | number;
  currency?: string;
};

export default function KpiCard({
  title,
  value,
  currency,
}: Props) {
  let Icon = Activity;

  let iconBg =
    "bg-slate-100";

  let iconColor =
    "text-slate-600";

  let valueColor =
    "text-slate-900";

  let subtitle =
    "";

  let displayTitle =
    title;

  let displayValue =
    Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const numericValue =
    Number(value);

  if (
    title.includes("Available Bird")
  ) {
    Icon = Bird;

    iconBg =
      "bg-blue-100";

    iconColor =
      "text-blue-600";

    subtitle =
      "Current birds on the farm";
  }

  if (
    title.includes("Starting Bird")
  ) {
    Icon = Bird;

    iconBg =
      "bg-indigo-100";

    iconColor =
      "text-indigo-600";

    subtitle =
      "Birds originally registered";
  }

  if (
    title.includes("Egg")
  ) {
    Icon = Egg;

    iconBg =
      "bg-amber-100";

    iconColor =
      "text-amber-600";

    subtitle =
      "Today's production";
  }

  if (
    title.includes("Revenue")
  ) {
    Icon = TrendingUp;

    iconBg =
      "bg-green-100";

    iconColor =
      "text-green-600";

    valueColor =
      "text-green-600";

    subtitle =
      "Income generated";

    displayValue =
      formatCurrency(
        numericValue,
        { currency }
      );
  }

  if (
    title.includes("Expense")
  ) {
    Icon = ReceiptText;

    iconBg =
      "bg-red-100";

    iconColor =
      "text-red-600";

    valueColor =
      "text-red-600";

    subtitle =
      "Operating costs";

    displayValue =
      formatCurrency(
        numericValue,
        { currency }
      );
  }

  if (
    title.includes("Profit")
  ) {
    Icon = Wallet;

    subtitle =
      "Net performance";

    displayValue =
      formatCurrency(
        numericValue,
        { currency }
      );

    if (
      numericValue >= 0
    ) {
      displayTitle =
        "Profit";

      iconBg =
        "bg-green-100";

      iconColor =
        "text-green-600";

      valueColor =
        "text-green-600";
    } else {
      displayTitle =
        "Loss";

      iconBg =
        "bg-red-100";

      iconColor =
        "text-red-600";

      valueColor =
        "text-red-600";
    }
  }

  if (
    title.includes("Production")
  ) {
    Icon = Activity;

    iconBg =
      "bg-cyan-100";

    iconColor =
      "text-cyan-600";

    subtitle =
      "Farm efficiency";
  }

  return (
    <div
      className="
        bg-white
        rounded-3xl
        border
        border-slate-200
        p-5
        shadow-sm
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
      "
    >
      <div className="flex items-start justify-between">

        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-wider
              font-semibold
              text-slate-500
            "
          >
            {displayTitle}
          </p>

          <h3
            className={`
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              ${valueColor}
            `}
          >
            {displayValue}
          </h3>

          <p
            className="
              mt-2
              text-xs
              text-slate-500
            "
          >
            {subtitle}
          </p>

        </div>

        <div
          className={`
            w-14
            h-14
            rounded-2xl
            flex
            items-center
            justify-center
            ${iconBg}
          `}
        >
          <Icon
            size={26}
            className={iconColor}
          />
        </div>

      </div>
    </div>
  );
}