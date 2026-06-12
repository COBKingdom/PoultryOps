type Props = {
  farmName?: string;
  currentBirds: number;
  productionPercentage: number;
};

export default function FarmHero({
  farmName,
  currentBirds,
  productionPercentage,
}: Props) {
  return (
    <div
      className="
        rounded-3xl
        bg-gradient-to-r
        from-blue-600
        to-blue-800
        text-white
        p-8
        shadow-lg
      "
    >
      <div className="space-y-3">

        <p className="text-blue-100 text-sm uppercase tracking-wider">
          PoultryOps Dashboard
        </p>

        <h2 className="text-3xl md:text-4xl font-bold">
          {farmName || "My Poultry Farm"}
        </h2>

        <div className="flex flex-wrap gap-6 pt-2">

          <div>
            <p className="text-blue-200 text-sm">
              Active Birds
            </p>

            <p className="text-2xl font-bold">
              {currentBirds}
            </p>
          </div>

          <div>
            <p className="text-blue-200 text-sm">
              Production Today
            </p>

            <p className="text-2xl font-bold">
              {productionPercentage}%
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}