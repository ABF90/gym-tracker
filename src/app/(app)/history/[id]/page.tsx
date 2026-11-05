import { HistoryDetail } from "@/features/history/history-detail";

export default async function HistoryDetailPage({ params }: PageProps<"/history/[id]">) {
  const { id } = await params;
  return <HistoryDetail entryKey={decodeURIComponent(id)} />;
}
