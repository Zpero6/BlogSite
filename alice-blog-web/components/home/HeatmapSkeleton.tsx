export default function HeatmapSkeleton() {
  return (
    <section
      className="acrylic-panel p-4 sm:p-5"
      aria-busy="true"
      aria-label="正在加载 GitHub 贡献数据"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="h-[95px] w-full animate-pulse rounded-lg bg-white/[0.05]" />
    </section>
  );
}
