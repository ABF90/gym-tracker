import { MuscleExercises } from "@/features/library/muscle-exercises";

export default async function MuscleExercisesPage({ params, searchParams }: PageProps<"/train/resistance/muscle/[groupId]">) {
  const { groupId } = await params;
  const { card } = await searchParams;
  return <MuscleExercises groupId={groupId} initialCard={typeof card === "string" ? card : undefined} />;
}
