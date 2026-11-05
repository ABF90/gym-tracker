import { CardioSetup } from "@/features/cardio/cardio-setup";

export default async function CardioSetupPage({ params }: PageProps<"/train/cardio/setup/[exerciseId]">) {
  const { exerciseId } = await params;
  return <CardioSetup exerciseId={exerciseId} />;
}
