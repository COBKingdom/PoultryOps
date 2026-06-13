import { Egg } from "lucide-react";

type Props = {
  records: any[];
};

export default function EggProductionList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-slate-900">
          Production Records
        </h2>

        <p className="text-slate-500 mt-1">
          Recent egg collection activity
        </p>

      </div>

      <div className="space-y-4">

        {records.map((record) => (

          <div
            key={record.id}
            className="
              rounded-2xl
              border
              border-slate-200
              p-5
              hover:shadow-md
              transition-all
            "
          >
            <div className="flex items-start justify-between">

              <div>

                <h3 className="font-bold text-lg text-slate-900">
                  {record.flocks?.flock_name}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {record.production_date}
                </p>

              </div>

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-amber-100
                  flex
                  items-center
                  justify-center
                "
              >
                <Egg
                  size={24}
                  className="text-amber-600"
                />
              </div>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Eggs Collected
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {record.egg_count}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Cracked Eggs
                </p>

                <p className="text-2xl font-bold text-amber-600">
                  {record.cracked_eggs || 0}
                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}