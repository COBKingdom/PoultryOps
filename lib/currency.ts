export function getCurrencySymbol(
  currency?: string
) {
  switch (currency) {
    case "USD":
      return "$";

    case "EUR":
      return "€";

    case "GBP":
      return "£";

    case "CAD":
      return "C$";

    case "AUD":
      return "A$";

    case "ZAR":
      return "R";

    case "GHS":
      return "GH₵";

    case "KES":
      return "KSh";

    case "NGN":
    default:
      return "₦";
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

  return `${symbol}${Number(
    amount || 0
  ).toLocaleString()}`;
}