import {
  Egg,
  Wheat,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      title:
        "Egg Production",
      detail:
        "Track daily egg collection and flock productivity.",
      icon: Egg,
    },
    {
      title:
        "Feed Management",
      detail:
        "Monitor feed consumption and inventory levels.",
      icon: Wheat,
    },
    {
      title:
        "Expenses",
      detail:
        "Record and review operational spending.",
      icon: Receipt,
    },
    {
      title:
        "Sales",
      detail:
        "Track farm revenue and customer transactions.",
      icon: ShoppingCart,
    },
    {
      title:
        "Mortality",
      detail:
        "Monitor bird losses and flock health trends.",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">
          Farm Operations
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Key areas being monitored within your farm
        </p>

      </div>

      <div className="space-y-4">

        {activities.map(
          (
            activity,
            index
          ) => {
            const Icon =
              activity.icon;

            return (
              <div
                key={index}
                className="
                  flex
                  items-center
                  gap-4
                  p-4
                  rounded-2xl
                  bg-slate-50
                  hover:bg-slate-100
                  transition-all
                "
              >

                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-blue-100
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

                <div className="flex-1">

                  <p className="font-medium text-slate-900">
                    {activity.title}
                  </p>

                  <p className="text-sm text-slate-500">
                    {activity.detail}
                  </p>

                </div>

                <CheckCircle
                  size={18}
                  className="text-green-500"
                />

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}