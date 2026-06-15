export function getCurrencySymbol(
  currency?: string
) {
  switch (currency) {
    case "NGN":
      return "₦";

    case "EUR":
      return "€";

    case "GBP":
      return "£";

    case "USD":
      return "$";

    default:
      return "";
  }
}

export function formatCurrency(
  amount: number,
  currency?: string
) {
  const symbol =
    getCurrencySymbol(
      currency
    );

  const absolute =
    Math.abs(amount);

  const formatted =
    absolute.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );

  return `${symbol}${formatted}`;
}