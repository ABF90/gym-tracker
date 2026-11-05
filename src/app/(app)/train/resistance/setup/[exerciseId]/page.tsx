import { ResistanceSetup } from "@/features/resistance/resistance-setup";

export default async function ResistanceSetupPage({ params, searchParams }: PageProps<"/train/resistance/setup/[exerciseId]">) {
  const { exerciseId } = await params;
  const { group, card } = await searchParams;
  return (
    <ResistanceSetup
      exerciseId={exerciseId}
      groupId={typeof group === "string" ? group : undefined}
      cardId={typeof card === "string" ? card : undefined}
    />
  );
}
