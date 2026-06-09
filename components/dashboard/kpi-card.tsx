type Props = {
  title: string;
  value: string | number;
};

export default function KpiCard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className="text-3xl font-bold mt-2">
        {value}
      </h3>
    </div>
  );
}