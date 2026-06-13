import {
  Egg,
  Wheat,
  Receipt,
  CheckCircle,
} from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      title: "Egg production recorded",
      detail: "0 eggs recorded today",
      icon: Egg,
    },
    {
      title: "Feed usage updated",
      detail: "Feed consumption logged",
      icon: Wheat,
    },
    {
      title: "Expense recorded",
      detail: "Latest farm expense saved",
      icon: Receipt,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Recent Activity
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Latest farm operations
        </p>
      </div>

      <div className="space-y-4">

        {activities.map(
          (activity, index) => {
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