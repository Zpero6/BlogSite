import { siteConfig } from "@/siteConfig";

function getRunningDays() {
  const start = new Date(siteConfig.buildDate).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

export default function StatusPanel({
  postCount,
  chatterCount,
  photoCount,
}: {
  postCount: number;
  chatterCount: number;
  photoCount: number;
}) {
  const runningDays = getRunningDays();

  const stats = [
    { value: postCount, label: "文章" },
    { value: chatterCount, label: "杂谈" },
    { value: photoCount, label: "照片" },
  ];

  return (
    <section
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
      aria-labelledby="status-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="status-heading" className="text-sm font-black tracking-widest text-slate-200">
          站点状态
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          ONLINE
        </span>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-400">
        {runningDays > 0 ? (
          <>
            已运行 <span className="font-black text-cyan-300">{runningDays}</span> 天 · 持续构建中
          </>
        ) : (
          <>今日上线 · 持续构建中</>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block text-xl font-black text-white">{stat.value}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
