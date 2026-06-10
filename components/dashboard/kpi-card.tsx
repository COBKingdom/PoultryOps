type Props = {
  title: string;
  value: string | number;
};

export default function KpiCard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">

      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
        {title}
      </p>

      <div className="mt-4">
        <h3 className="text-4xl font-bold text-slate-900">
          {value}
        </h3>
      </div>

    </div>
  );
}