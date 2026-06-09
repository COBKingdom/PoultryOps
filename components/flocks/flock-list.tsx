type Props = {
  flocks: any[];
};

export default function FlockList({
  flocks,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Flocks
      </h2>

      <div className="space-y-3">

        {flocks.map(
          (flock) => (
            <div
              key={flock.id}
              className="border rounded p-3"
            >
              <div className="font-semibold">
                {
                  flock.flock_name
                }
              </div>

              <div>
                {
                  flock.bird_type
                }
              </div>

              <div>
                Qty: {
                  flock.quantity
                }
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}