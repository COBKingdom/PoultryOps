type Props = {
  email?: string;
  title?: string;
};

export default function Topbar({
  email,
  title,
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
    <div
      className="
        bg-white
        border-b
        border-slate-200
        px-4
        md:px-6
        py-3
        sticky
        top-0
        z-20
      "
    >
      <div className="flex items-center justify-between">

        <div className="min-w-0">

          <p
            className="
              text-xs
              md:text-sm
              text-slate-500
            "
          >
            {greeting}
          </p>

          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              text-slate-900
              truncate
            "
          >
            {title || "PoultryOps"}
          </h1>

        </div>

        <div
          className="
            flex
            items-center
            gap-3
            shrink-0
          "
        >

          <div
            className="
              hidden
              lg:block
              text-right
            "
          >

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              Signed in as
            </p>

            <p
              className="
                text-sm
                font-medium
                text-slate-900
              "
            >
              {email}
            </p>

          </div>

          <div
            className="
              w-11
              h-11
              rounded-full
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              font-semibold
              text-lg
            "
          >
            {email
              ?.charAt(0)
              .toUpperCase()}
          </div>

        </div>

      </div>
    </div>
  );
}