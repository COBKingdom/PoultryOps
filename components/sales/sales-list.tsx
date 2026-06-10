type Props = {
  records: any[];
};

export default function SalesList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Sales Records
      </h2>

      <div className="space-y-3">

        {records.map(
          (record) => (
            <div
              key={record.id}
              className="border rounded p-3"
            >
              <div className="font-semibold">
                {record.item_type}
              </div>

              <div>
                Quantity: {
                  record.quantity
                }
              </div>

              <div>
                Unit Price: {
                  record.unit_price
                }
              </div>

              <div>
                Total: {
                  record.total_amount
                }
              </div>

              <div>
                {record.notes}
              </div>

              <div>
                {record.sale_date}
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}