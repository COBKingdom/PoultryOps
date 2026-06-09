type Props = {
  plan?: string;
  status?: string;
  daysRemaining?: number;
};

export default function SubscriptionCard({
  plan,
  status,
  daysRemaining,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg">
        Subscription
      </h2>

      <p className="mt-2">
        Plan: {plan}
      </p>

      <p>
        Status: {status}
      </p>

      <p>
        Days Remaining: {daysRemaining}
      </p>
    </div>
  );
}