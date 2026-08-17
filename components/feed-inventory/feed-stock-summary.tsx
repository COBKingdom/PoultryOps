"use client";

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

  const summary = feedTypes.map((type) => {
    const purchased = inventoryRecords
      .filter(
        (record) =>
          record.feed_type === type
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(record.quantity_kg || 0),
        0
      );

    const consumed = feedRecords
      .filter(
        (record) =>
          record.feed_type === type
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(record.quantity_kg || 0),
        0
      );

    const remaining = purchased - consumed;

    let status = "Healthy";
    let statusClass = "bg-green-100 text-green-700";

    if (
      remaining <= 50 &&
      remaining > 20
    ) {
      status = "Monitor";
      statusClass = "bg-amber-100 text-amber-700";
    }

    if (remaining <= 20) {
      status = "Low Stock";
      statusClass = "bg-red-100 text-red-700";
    }

    return {
      type,
      purchased,
      consumed,
      remaining,
      status,
      statusClass,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Feed Stock Summary
        </h2>

        <p className="text-slate-500 mt-1">
          Purchased, consumed and available feed stock
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {summary.map((item) => (
          <div
            key={item.type}
            className="
              border
              border-slate-200
              rounded-2xl
              p-5
            "
          >

            <div className="flex items-center justify-between">

              <h3 className="font-bold text-lg">
                {item.type}
              </h3>

              <span
                className={`
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-medium
                  ${item.statusClass}
                `}
              >
                {item.status}
              </span>

            </div>

            <div className="mt-4 space-y-3">

              <div className="flex justify-between">
                <span>
                  Purchased
                </span>

                <span className="font-semibold">
                  {Number(item.purchased).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                  kg
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Consumed
                </span>

                <span className="font-semibold">
                  {Number(item.consumed).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                  kg
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between">

                <span className="font-medium">
                  Remaining
                </span>

                <span className="font-bold text-blue-600">
                  {Number(item.remaining).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                  kg
                </span>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}