import { supabase } from "@/lib/supabase";

export type FeedIntelligencePeriod = {
  from: string;
  to: string;
};

export type FlockFeedPerformance = {
  flockId: string;
  flockName: string;
  startingBirds: number;
  feedConsumedKg: number;
  averageDailyFeedKg: number;
  feedPerStartingBirdKg: number;
  daysInPeriod: number;
};

export type FeedIntelligenceResult = {
  totalFeedConsumedKg: number;
  averageDailyFeedKg: number;
  flockCount: number;
  flocks: FlockFeedPerformance[];
};

/*
 * Calculate the number of calendar days in
 * the selected reporting period.
 */
function getDaysInPeriod(
  from: string,
  to: string
) {
  const start = new Date(
    `${from}T00:00:00`
  );

  const end = new Date(
    `${to}T00:00:00`
  );

  const difference =
    end.getTime() -
    start.getTime();

  return Math.max(
    1,
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

/*
 * Get actual feed consumption intelligence
 * for a farm.
 *
 * V1 deliberately uses actual recorded feed
 * consumption only.
 *
 * No expected-consumption assumptions are made
 * here. Those will be introduced in the next
 * intelligence layer.
 */
export async function getFeedIntelligence(
  farmId: string,
  period: FeedIntelligencePeriod,
  flockId?: string
): Promise<FeedIntelligenceResult> {
  const daysInPeriod =
    getDaysInPeriod(
      period.from,
      period.to
    );

  /*
   * Get flocks belonging to this farm.
   *
   * Archived flocks are excluded because this
   * page is intended for operational analysis.
   */
  let flockQuery =
    supabase
      .from("flocks")
      .select(
        "id, flock_name, quantity"
      )
      .eq(
        "farm_id",
        farmId
      )
      .is(
        "archived_at",
        null
      );

  if (flockId) {
    flockQuery =
      flockQuery.eq(
        "id",
        flockId
      );
  }

  const {
    data: flocks,
    error: flockError,
  } = await flockQuery.order(
    "flock_name"
  );

  if (flockError) {
    throw flockError;
  }

  if (!flocks?.length) {
    return {
      totalFeedConsumedKg: 0,
      averageDailyFeedKg: 0,
      flockCount: 0,
      flocks: [],
    };
  }

  const flockIds =
    flocks.map(
      (flock) =>
        flock.id
    );

  /*
   * Get actual feed records for the selected
   * reporting period and selected flocks.
   */
  const {
    data: feedRecords,
    error: feedError,
  } =
    await supabase
      .from("feed_records")
      .select(
        "flock_id, quantity_kg, feed_date"
      )
      .eq(
        "farm_id",
        farmId
      )
      .in(
        "flock_id",
        flockIds
      )
      .gte(
        "feed_date",
        period.from
      )
      .lte(
        "feed_date",
        period.to
      );

  if (feedError) {
    throw feedError;
  }

  /*
   * Group actual feed consumption by flock.
   */
  const consumptionByFlock =
    new Map<
      string,
      number
    >();

  for (const record of
    feedRecords || []) {
    const current =
      consumptionByFlock.get(
        record.flock_id
      ) || 0;

    consumptionByFlock.set(
      record.flock_id,
      current +
        Number(
          record.quantity_kg || 0
        )
    );
  }

  const performance =
    flocks.map(
      (flock) => {
        const feedConsumedKg =
          consumptionByFlock.get(
            flock.id
          ) || 0;

        const startingBirds =
          Number(
            flock.quantity || 0
          );

        return {
          flockId:
            flock.id,

          flockName:
            flock.flock_name ||
            "Unnamed Flock",

          startingBirds,

          feedConsumedKg,

          averageDailyFeedKg:
            feedConsumedKg /
            daysInPeriod,

          /*
           * V1 uses starting flock quantity.
           *
           * We will replace/expand this with a
           * period-aware bird population calculation
           * when we introduce the historical population
           * intelligence layer.
           */
          feedPerStartingBirdKg:
            startingBirds > 0
              ? feedConsumedKg /
                startingBirds
              : 0,

          daysInPeriod,
        };
      }
    );

  const totalFeedConsumedKg =
    performance.reduce(
      (sum, flock) =>
        sum +
        flock.feedConsumedKg,
      0
    );

  return {
    totalFeedConsumedKg,

    averageDailyFeedKg:
      totalFeedConsumedKg /
      daysInPeriod,

    flockCount:
      performance.length,

    flocks: performance,
  };
}