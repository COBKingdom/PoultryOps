type Props = {
  email?: string;
};

export default function Topbar({
  email,
}: Props) {
  return (
    <div className="border-b bg-white p-4 flex justify-between">
      <h1 className="font-semibold">
        Dashboard
      </h1>

      <div>{email}</div>
    </div>
  );
}