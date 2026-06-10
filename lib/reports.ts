import { getTotalBirds } from "@/lib/flocks";
import { getTodayEggs } from "@/lib/eggs";
import { getTodayFeed } from "@/lib/feed";
import { getTotalMortality } from "@/lib/mortality";
import { getTotalExpenses } from "@/lib/expenses";
import { getTotalRevenue } from "@/lib/sales";

export async function getFarmReport(
  farmId: string
) {
  const birds =
    await getTotalBirds(
      farmId
    );

  const eggs =
    await getTodayEggs(
      farmId
    );

  const feed =
    await getTodayFeed(
      farmId
    );

  const mortality =
    await getTotalMortality(
      farmId
    );

  const expenses =
    await getTotalExpenses(
      farmId
    );

  const revenue =
    await getTotalRevenue(
      farmId
    );

  return {
    currentBirds:
      birds - mortality,
    eggs,
    feed,
    mortality,
    revenue,
    expenses,
    profit:
      revenue -
      expenses,
  };
}