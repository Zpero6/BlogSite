export default function HeatmapSkeleton() {
  return (
    <section
      className="py-2"
      aria-busy="true"
      aria-label="正在加载 GitHub 贡献数据"
    >
      <div className="h-[95px] w-full animate-pulse rounded-lg bg-white/15" />
    </section>
  );
}
