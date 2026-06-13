type Props = {
  flocks: any[];
};

export default function FlockList({
  flocks,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          Flock Records
        </h2>

        <p className="text-slate-500 mt-1">
          Active poultry flocks
        </p>

      </div>

      <div className="space-y-4">

        {flocks.map(
          (flock) => (
            <div
              key={flock.id}
              className="
                border
                border-slate-200
                rounded-3xl
                p-5
              "
            >
              <div className="flex justify-between items-start">

                <div>

                  <h3 className="font-bold text-xl">
                    {flock.flock_name}
                  </h3>

                  <p className="text-slate-500 mt-1">
                    {flock.bird_type}
                  </p>

                </div>

                <div
                  className="
                    px-4
                    py-2
                    rounded-2xl
                    bg-blue-100
                    text-blue-700
                    font-bold
                  "
                >
                  {flock.quantity}
                </div>

              </div>

              <div className="mt-4">

                <span
                  className="
                    px-3
                    py-1
                    rounded-full
                    bg-green-100
                    text-green-700
                    text-sm
                    font-medium
                  "
                >
                  Active
                </span>

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}