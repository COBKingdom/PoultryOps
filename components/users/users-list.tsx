type Props = {
  users: any[];
  plan?: string;
};

export default function UsersList({
  users,
  plan = "trial",
}: Props) {
  const userLimit =
    plan === "business"
      ? 6
      : plan === "team"
      ? 3
      : 1;

  const userCount =
    users.length;

  const usagePercentage =
    Math.min(
      100,
      (userCount / userLimit) * 100
    );

  const limitReached =
    userCount >= userLimit;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Farm Users
      </h2>

      {/* Subscription Usage */}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

        <div className="flex items-center justify-between mb-3">

          <div>
            <p className="text-sm text-slate-500">
              Current Plan
            </p>

            <p className="text-xl font-bold capitalize">
              {plan}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">
              Users Used
            </p>

            <p className="text-xl font-bold">
              {userCount} / {userLimit}
            </p>
          </div>

        </div>

        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-blue-600"
            style={{
              width: `${usagePercentage}%`,
            }}
          />
        </div>

        {limitReached && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="font-medium text-amber-800">
              You have reached the {plan} plan limit of {userLimit} users.
            </p>

            <p className="text-sm text-amber-700 mt-1">
              Upgrade your subscription to add more team members.
            </p>

            <a
              href="/settings/subscription"
              className="
                inline-block
                mt-4
                px-4
                py-2
                rounded-xl
                bg-blue-600
                text-white
              "
            >
              Manage Subscription
            </a>

          </div>
        )}

      </div>

      <div className="space-y-4">

        {users.map((user) => (
          <div
            key={user.id}
            className="
              border
              border-slate-200
              rounded-2xl
              p-4
              flex
              justify-between
              items-center
            "
          >
            <div>

              <p className="font-semibold">
                {user.email}
              </p>

              <p className="text-sm text-slate-500">
                Joined{" "}
                {new Date(
                  user.created_at
                ).toLocaleDateString()}
              </p>

            </div>

            <span
              className="
                px-3
                py-1
                rounded-xl
                bg-blue-100
                text-blue-700
                text-sm
                font-semibold
              "
            >
              {user.role}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}