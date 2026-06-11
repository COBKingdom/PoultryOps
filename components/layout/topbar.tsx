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
    <div className="
      bg-white
      border-b
      border-slate-200
      px-6
      py-4
      flex
      items-center
      justify-between
      sticky
      top-0
      z-20
    ">

      <div>

        <p className="
          text-sm
          text-slate-500
        ">
          {greeting}
        </p>

        <h1 className="
          text-2xl
          font-bold
          text-slate-900
        ">
          Poultry Dashboard
        </h1>

      </div>

      <div className="
        flex
        items-center
        gap-4
      ">

        <div className="
          hidden
          md:block
          text-right
        ">

          <p className="
            text-xs
            text-slate-500
          ">
            Signed in as
          </p>

          <p className="
            text-sm
            font-medium
            text-slate-900
          ">
            {email}
          </p>

        </div>

        <div className="
          w-10
          h-10
          rounded-full
          bg-blue-600
          text-white
          flex
          items-center
          justify-center
          font-semibold
        ">
          {email?.charAt(0)
            .toUpperCase()}
        </div>

      </div>

    </div>
  );
}