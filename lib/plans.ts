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

export const PLAN_ORDER = ["solo", "team", "business"] as const;

export const PLAN_FEATURES: Record<string, string[]> = {
  solo: [
    "1 user",
    "Core farm tracking",
    "Basic analytics",
    "Email support",
  ],
  team: [
    "Up to 3 users",
    "Full farm management",
    "Advanced analytics",
    "Priority support",
    "API access",
  ],
  business: [
    "Up to 6 users",
    "Full farm management",
    "Custom analytics",
    "Dedicated support",
    "API access",
    "Priority onboarding",
  ],
};

export const ANNUAL_SAVINGS: Record<string, string> = {
  solo:     "Saves ₦12,000",
  team:     "Saves ₦18,000",
  business: "Saves ₦24,000",
};