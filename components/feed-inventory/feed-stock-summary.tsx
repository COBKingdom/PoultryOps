type Props = {
  inventoryRecords?: any[];
  feedRecords?: any[];
};

export default function FeedStockSummary({
  inventoryRecords = [],
  feedRecords = [],
}: Props) {
  const feedTypes = [
    "Starter",
    "Grower",
    "Finisher",
    "Layer Mash",
  ];

  const summary =
    feedTypes.map((type) => {
      const purchased =
        inventoryRecords
          .filter(
            (record) =>
              record.feed_type ===
              type
          )
          .reduce(
            (
              sum,
              record
            ) =>
              sum +
              Number(
                record.quantity_kg
              ),
            0
          );

      const consumed =
        feedRecords
          .filter(
            (record) =>
              record.feed_type ===
              type
          )
          .reduce(
            (
              sum,
              record
            ) =>
              sum +
              Number(
                record.quantity_kg
              ),
            0
          );

      return {
        type,
        purchased,
        consumed,
        remaining:
          purchased -
          consumed,
      };
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          Feed Stock Summary
        </h2>

        <p className="text-slate-500 mt-1">
          Purchased, consumed and remaining stock
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {summary.map(
          (item) => (
            <div
              key={item.type}
              className="
                border
                border-slate-200
                rounded-2xl
                p-5
              "
            >

              <h3 className="font-bold text-lg">
                {item.type}
              </h3>

              <div className="mt-4 space-y-2">

                <div className="flex justify-between">
                  <span>
                    Purchased
                  </span>

                  <span className="font-semibold">
                    {item.purchased}
                    kg
                  </span>

                </div>

                <div className="flex justify-between">
                  <span>
                    Consumed
                  </span>

                  <span className="font-semibold">
                    {item.consumed}
                    kg
                  </span>

                </div>

                <div className="flex justify-between border-t pt-2">

                  <span className="font-medium">
                    Remaining
                  </span>

                  <span className="font-bold text-blue-600">
                    {item.remaining}
                    kg
                  </span>

                </div>

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}