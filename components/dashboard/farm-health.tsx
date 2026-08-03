import {
  Bird,
  Activity,
  Shield,
  Wheat,
} from "lucide-react";

type Props = {
  currentBirds: number;
  productionPercentage: number;
};

export default function FarmHealth({
  currentBirds,
  productionPercentage,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-xl font-bold text-slate-900 mb-6">
        Farm Health
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-blue-50 p-4">
          <Bird
            className="text-blue-600 mb-2"
            size={24}
          />

          <p className="text-sm text-slate-600">
            Available Birds
          </p>

          <p className="font-bold text-slate-900">
            {Number(currentBirds).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <Activity
            className="text-green-600 mb-2"
            size={24}
          />

          <p className="text-sm text-slate-600">
            Production
          </p>

          <p className="font-bold text-slate-900">
            {Number(productionPercentage).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}%
          </p>
        </div>

        <div className="rounded-2xl bg-purple-50 p-4">
          <Shield
            className="text-purple-600 mb-2"
            size={24}
          />

          <p className="text-sm text-slate-600">
            Health Status
          </p>

          <p className="font-bold text-slate-900">
            Normal
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <Wheat
            className="text-amber-600 mb-2"
            size={24}
          />

          <p className="text-sm text-slate-600">
            Feed Status
          </p>

          <p className="font-bold text-slate-900">
            Available
          </p>
        </div>

      </div>

    </div>
  );
}