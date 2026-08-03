"use client";

type Props = {
  loading: boolean;
  flocks: any[];
  onEdit: (flock: any) => void;
  onDelete: (id: string) => void;
};

export default function FlockList({
  loading,
  flocks,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-center text-slate-500">
          Loading flocks...
        </p>
      </div>
    );
  }

  if (flocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
          🐣
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          No Flocks Yet
        </h2>

        <p className="mt-3 text-slate-500 max-w-md mx-auto">
          Create your first flock to begin tracking
          production, mortality, feed consumption and
          overall farm performance.
        </p>

      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

        <div>

          <h2 className="text-xl font-bold text-slate-900">
            Current Flocks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {flocks.length} flock
            {flocks.length !== 1 ? "s" : ""} registered
          </p>

        </div>

      </div>

      <div className="divide-y divide-slate-100">

        {flocks.map((flock) => (
          <div
            key={flock.id}
            className="p-6 transition hover:bg-slate-50"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="space-y-3">

                <div className="flex flex-wrap items-center gap-3">

                  <h3 className="text-xl font-semibold text-slate-900">
                    {flock.flock_name}
                  </h3>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>

                </div>

                <div className="flex flex-wrap gap-2">

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {flock.bird_type}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {Number(
                      flock.quantity
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} Birds
                  </span>

                </div>

                <p className="text-sm text-slate-400">
                  Created{" "}
                  {new Date(
                    flock.created_at
                  ).toLocaleDateString()}
                </p>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => onEdit(flock)}
                  className="
                    rounded-xl
                    border
                    border-blue-200
                    bg-blue-50
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-blue-700
                    transition
                    hover:bg-blue-100
                  "
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    onDelete(flock.id)
                  }
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-red-700
                    transition
                    hover:bg-red-100
                  "
                >
                  Delete
                </button>

              </div>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}