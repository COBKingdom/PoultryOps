import {
  Bird,
  Egg,
  DollarSign,
  Receipt,
  TrendingUp,
  Activity,
} from "lucide-react";

type Props = {
  title: string;
  value: string | number;
};

export default function KpiCard({
  title,
  value,
}: Props) {
  let Icon = Activity;

  if (
    title.includes("Bird")
  ) {
    Icon = Bird;
  }

  if (
    title.includes("Egg")
  ) {
    Icon = Egg;
  }

  if (
    title.includes("Revenue")
  ) {
    Icon = DollarSign;
  }

  if (
    title.includes("Expense")
  ) {
    Icon = Receipt;
  }

  if (
    title.includes("Profit")
  ) {
    Icon = TrendingUp;
  }

  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-slate-200
        p-6
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-200
      "
    >
      <div className="flex items-center justify-between">

        <div>

          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            {title}
          </p>

          <h3
            className="
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              text-slate-900
            "
          >
            {value}
          </h3>

        </div>

        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-blue-50
            flex
            items-center
            justify-center
          "
        >
          <Icon
            size={22}
            className="text-blue-600"
          />
        </div>

      </div>
    </div>
  );
}