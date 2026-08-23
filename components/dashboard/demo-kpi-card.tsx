import type {
  ElementType,
} from "react";

import {
  formatCurrency,
  formatNumber,
} from "@/lib/currency";

type CardTheme = {
  iconBg: string;
  iconColor: string;
  valueColor?: string;
};

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  currency?: string;
  icon: ElementType;
  theme: CardTheme;
  /** Optional value suffix, e.g. "%" or "kg" */
  suffix?: string;
};

/*
 * Flexible, themeable KPI card for the demo grid.
 *
 * Mirrors the visual language of the existing KpiCard
 * (rounded-3xl, border, shadow, lift on hover) while
 * allowing a per-metric colour accent so the demo grid
 * stays vivid and professional.
 *
 * Financial cards (Revenue, Expenses, Profit) are
 * rendered with the existing KpiCard instead.
 */
export default function DemoKpiCard({
  title,
  value,
  subtitle,
  currency,
  icon: Icon,
  theme,
  suffix,
}: Props) {
  const numericValue = Number(value);

  const displayValue = currency
    ? formatCurrency(numericValue, { currency })
    : formatNumber(numericValue);

  const formatted = suffix
    ? `${displayValue}${suffix}`
    : displayValue;

  const valueColor =
    theme.valueColor || "text-slate-900";

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
            {title}
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
            {formatted}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`
            w-14
            h-14
            rounded-2xl
            flex
            items-center
            justify-center
            ${theme.iconBg}
          `}
        >
          <Icon
            size={26}
            className={theme.iconColor}
          />
        </div>
      </div>
    </div>
  );
}

export { type CardTheme };