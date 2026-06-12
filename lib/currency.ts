export const currencies = {
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
  },

  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },

  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },

  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
  },

  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
  },

  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
  },

  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
  },

  GHS: {
    code: "GHS",
    symbol: "GH₵",
    name: "Ghanaian Cedi",
  },

  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
  },
};

export function formatCurrency(
  amount: number,
  currency: string = "NGN"
) {
  const selected =
    currencies[
      currency as keyof typeof currencies
    ];

  if (!selected) {
    return amount.toLocaleString();
  }

  return `${selected.symbol}${amount.toLocaleString()}`;
}