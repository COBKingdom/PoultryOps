export const PLANS = {
  solo: {
    name: "Solo",
    monthly: 10000,
    annual: 108000,
    users: 1,
  },

  team: {
    name: "Team",
    monthly: 15000,
    annual: 162000,
    users: 3,
  },

  business: {
    name: "Business",
    monthly: 20000,
    annual: 216000,
    users: 6,
  },
};

export function getFlutterwavePublicKey() {
  return (
    process.env
      .NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || ""
  );
}