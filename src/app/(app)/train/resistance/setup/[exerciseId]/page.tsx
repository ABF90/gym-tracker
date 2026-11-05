import { ResistanceSetup } from "@/features/resistance/resistance-setup";

export default async function ResistanceSetupPage({ params }: PageProps<"/train/resistance/setup/[exerciseId]">) {
  const { exerciseId } = await params;
  return <ResistanceSetup exerciseId={exerciseId} />;
}
