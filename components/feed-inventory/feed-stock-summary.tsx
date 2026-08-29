"use client";

import {
  getFeedPurchaseDetails,
} from "@/lib/feedInventory";

type Props = {
  records: any[];
  feedRecords: any[];
};

const FEED_TYPES = [
  "Starter",
  "Grower",
  "Finisher",
  "Layer Mash",
  "Broiler Starter",
  "Broiler Finisher",
  "Concentrate",
  "Supplement",
  "Other",
];

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function FeedStockSummary({
  records,
  feedRecords,
}: Props) {
  /*
   * This section represents the farm's CURRENT
   * inventory position.
   *
   * Purchases and consumption are therefore
   * calculated from ALL historical records,
   * regardless of the date filter used elsewhere
   * on the page.
   *
   * All operational calculations remain in KG.
   * Bag equivalents are display-only.
   *
   * Standard PoultryOps bag = 25 kg.
   */

  const summaries = FEED_TYPES.map((feedType) => {
    /*
     * All purchases for this feed type.
     */
    const purchases = records.filter(
      (record) =>
        String(record.feed_type || "").toLowerCase() ===
        feedType.toLowerCase()
    );

    /*
     * All consumption for this feed type.
     */
    const consumed = feedRecords
      .filter(
        (record) =>
          String(record.feed_type || "").toLowerCase() ===
          feedType.toLowerCase()
      )
      .reduce(
        (sum, record) =>
          sum + Number(record.quantity_kg || 0),
        0
      );

    /*
     * Convert purchases to KG using the
     * central feed-purchase calculation.
     */
    const purchasedKg = purchases.reduce(
      (sum, record) => {
        const details = getFeedPurchaseDetails(record);

        return sum + Number(details.quantityKg || 0);
      },
      0
    );

    /*
     * Total purchased bags.
     */
    const purchasedBags = purchases.reduce(
      (sum, record) => {
        const details = getFeedPurchaseDetails(record);

        return sum + Number(details.quantityBags || 0);
      },
      0
    );

    /*
     * Actual stock calculation.
     *
     * Current stock = total purchases - total consumption.
     */
    const rawRemainingKg =
      purchasedKg - consumed;

    /*
     * If consumption is greater than recorded
     * purchases, retain the deficit separately.
     *
     * We do NOT hide this situation.
     */
    const hasStockDeficit =
      rawRemainingKg < 0;

    const stockDeficitKg =
      hasStockDeficit
        ? Math.abs(rawRemainingKg)
        : 0;

    /*
     * Current stock cannot be negative as an
     * inventory quantity.
     *
     * The deficit is shown separately when one exists.
     */
    const currentStockKg =
      Math.max(0, rawRemainingKg);

    /*
     * Display-only conversion to standard
     * 25 kg bag equivalents.
     */
    const currentBagEquivalent =
      currentStockKg / 25;

    return {
      feedType,
      purchasedKg,
      purchasedBags,
      consumed,
      currentStockKg,
      currentBagEquivalent,
      hasStockDeficit,
      stockDeficitKg,
    };
  });

  /*
   * Only show feed types with actual activity.
   */
  const activeSummaries =
    summaries.filter(
      (summary) =>
        summary.purchasedKg > 0 ||
        summary.consumed > 0
    );

  /*
   * Empty state.
   */
  if (activeSummaries.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        <div className="mb-2">

          <h2 className="text-2xl font-bold text-slate-900">
            Current Feed Stock
          </h2>

          <p className="text-slate-500 mt-1">
            Current stock position by feed type.
          </p>

        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center mt-5">

          <p className="text-sm text-slate-500">
            Feed stock information will appear here
            after purchases or feed consumption are recorded.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-slate-900">
          Current Feed Stock
        </h2>

        <p className="text-slate-500 mt-1">
          Current inventory position by feed type.
          All stock calculations are in kilograms.
        </p>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {activeSummaries.map((summary) => {

          /*
           * Stock status.
           *
           * 0 kg:
           * No Stock
           *
           * >0 and <50 kg:
           * Monitor
           *
           * >=50 kg:
           * Healthy
           *
           * 50 kg = 2 standard 25 kg bags.
           *
           * A deficit always takes priority.
           */
          let statusLabel = "Healthy";
          let statusClass =
            "bg-emerald-100 text-emerald-700";

          if (summary.hasStockDeficit) {
            statusLabel = "Stock Review";
            statusClass =
              "bg-red-100 text-red-700";
          } else if (
            summary.currentStockKg <= 0
          ) {
            statusLabel = "No Stock";
            statusClass =
              "bg-red-100 text-red-700";
          } else if (
            summary.currentStockKg < 50
          ) {
            statusLabel = "Monitor";
            statusClass =
              "bg-amber-100 text-amber-700";
          }

          return (
            <div
              key={summary.feedType}
              className="rounded-2xl border border-slate-200 p-5"
            >

              {/* Feed type and status */}
              <div className="flex items-center justify-between gap-3">

                <h3 className="font-bold text-lg text-slate-900">
                  {summary.feedType}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                >
                  {statusLabel}
                </span>

              </div>

              <div className="mt-5 space-y-3">

                {/* Purchased */}
                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Purchased to date
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(
                      summary.purchasedBags
                    )}{" "}
                    {summary.purchasedBags === 1
                      ? "bag"
                      : "bags"}
                  </span>

                </div>

                <div className="text-right -mt-2 text-sm text-slate-500">
                  {formatNumber(
                    summary.purchasedKg
                  )}{" "}
                  kg
                </div>

                {/* Consumed */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">

                  <span className="text-slate-600">
                    Consumed to date
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(
                      summary.consumed
                    )}{" "}
                    kg
                  </span>

                </div>

                {/* Current stock */}
                <div className="border-t border-slate-200 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-medium text-slate-700">
                      Current Stock
                    </span>

                    <span
                      className={`font-bold ${
                        summary.hasStockDeficit
                          ? "text-red-600"
                          : summary.currentStockKg <= 0
                          ? "text-red-600"
                          : summary.currentStockKg < 50
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    >
                      {formatNumber(
                        summary.currentStockKg
                      )}{" "}
                      kg
                    </span>

                  </div>

                  <div className="text-right text-sm text-slate-500 mt-1">
                    ≈{" "}
                    {formatNumber(
                      summary.currentBagEquivalent
                    )}{" "}
                    standard 25 kg bag
                    {summary.currentBagEquivalent === 1
                      ? ""
                      : "s"}
                  </div>

                </div>

                {/* Stock deficit warning */}
                {summary.hasStockDeficit && (
                  <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-3">

                    <p className="text-xs font-semibold text-red-700">
                      Stock review required
                    </p>

                    <p className="text-xs text-red-600 mt-1">
                      Recorded consumption exceeds
                      recorded purchases by{" "}
                      {formatNumber(
                        summary.stockDeficitKg
                      )}{" "}
                      kg.
                    </p>

                  </div>
                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}