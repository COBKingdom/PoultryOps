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
      "bg-blue-50";

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
      "bg-indigo-50";

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
      "bg-amber-50";

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
      "bg-green-50";

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
      "bg-red-50";

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
        "bg-green-50";

      iconColor =
        "text-green-600";

      valueColor =
        "text-green-600";
    } else {
      displayTitle =
        "Loss";

      iconBg =
        "bg-red-50";

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
      "bg-cyan-50";

    iconColor =
      "text-cyan-600";

    subtitle =
      "Farm efficiency";
  }

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        px-4
        py-4
        shadow-sm
        transition-shadow
        duration-200
        hover:shadow-md
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            {displayTitle}
          </p>

          <h3
            className={`
              mt-1
              truncate
              text-2xl
              font-bold
              tracking-tight
              sm:text-3xl
              ${valueColor}
            `}
          >
            {displayValue}
          </h3>

          <p
            className="
              mt-1
              truncate
              text-[11px]
              text-slate-500
            "
          >
            {subtitle}
          </p>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${iconBg}
          `}
        >
          <Icon
            size={19}
            className={iconColor}
          />
        </div>
      </div>
    </div>
  );
}