type Props = {
  email?: string;
};

export default function Topbar({
  email,
}: Props) {
  const hour =
    new Date().getHours();

  let greeting =
    "Good Morning";

  if (hour >= 12) {
    greeting =
      "Good Afternoon";
  }

  if (hour >= 17) {
    greeting =
      "Good Evening";
  }

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          {greeting}
        </p>
      </div>

      <div className="text-right">

        <p className="text-sm text-slate-500">
          Signed in as
        </p>

        <p className="font-medium text-slate-900">
          {email}
        </p>

      </div>

    </div>
  );
}