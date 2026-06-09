type Props = {
  farmName?: string;
};

export default function FarmCard({
  farmName,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg">
        Farm
      </h2>

      <p className="mt-2">
        {farmName}
      </p>
    </div>
  );
}