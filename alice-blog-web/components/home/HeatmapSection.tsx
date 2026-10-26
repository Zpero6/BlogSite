import { getContributions } from "@/lib/githubContributions";
import ContributionHeatmap from "./ContributionHeatmap";
import HeatmapError from "./HeatmapError";

export default async function HeatmapSection() {
  const result = await getContributions();

  return result.ok ? (
    <ContributionHeatmap data={result.data} />
  ) : (
    <HeatmapError initialError={result.error} />
  );
}
