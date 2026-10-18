
import PublicOrderingForm from "./public-ordering-form";

type PageProps = {
  params: Promise<{ farmId: string }>;
};

export default async function PublicOrderPage({ params }: PageProps) {
  const { farmId } = await params;

  return <PublicOrderingForm farmId={farmId} />;
}
