type Props = {
  users: any[];
};

export default function UsersList({
  users,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        Farm Users
      </h2>

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