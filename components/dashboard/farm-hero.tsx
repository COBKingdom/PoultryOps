import {
  Bird,
  Egg,
} from "lucide-react";

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
        bg-gradient-to-br
        from-blue-600
        via-blue-700
        to-slate-900
        text-white
        overflow-hidden
        shadow-xl
      "
    >
      <div className="p-6 md:p-8">

        <p
          className="
            text-blue-100
            text-xs
            uppercase
            tracking-[0.2em]
            font-semibold
          "
        >
          PoultryOps
        </p>

        <h2
          className="
            mt-3
            text-3xl
            md:text-5xl
            font-bold
            leading-tight
          "
        >
          {farmName || "My Poultry Farm"}
        </h2>

        <p
          className="
            mt-2
            text-blue-100
            text-sm
            md:text-base
          "
        >
          Real-time farm performance overview
        </p>

        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-4
          "
        >

          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <Bird size={18} />

              <span className="text-sm">
                Active Birds
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {currentBirds}
            </div>
          </div>

          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <Egg size={18} />

              <span className="text-sm">
                Production
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {productionPercentage}%
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}