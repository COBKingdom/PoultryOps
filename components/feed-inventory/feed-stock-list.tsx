type Props = {
  records: any[];
};

export default function FeedStockList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Feed Inventory
      </h2>

      <div className="space-y-3">

        {records.map(
          (record) => (
            <div
              key={record.id}
              className="border rounded p-3"
            >
              <div className="font-semibold">
                {record.feed_type}
              </div>

              <div>
                Quantity:
                {" "}
                {
                  record.quantity_kg
                }kg
              </div>

              <div>
                Cost:
                {" "}
                {record.cost}
              </div>

              <div>
                Supplier:
                {" "}
                {
                  record.supplier
                }
              </div>

              <div>
                {
                  record.purchase_date
                }
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}