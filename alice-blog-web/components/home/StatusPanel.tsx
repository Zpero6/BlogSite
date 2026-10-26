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

  const milestones = [
    { label: "站点上线", date: "2026.10.26" },
    { label: "首页重构", date: "2026.10.26" },
    { label: "Git 发布", date: "2026.10.26" },
    { label: "持续构建", date: "进行中", active: true },
  ];

  return (
    <section className="acrylic-panel p-5" aria-labelledby="status-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="status-heading" className="text-sm font-black text-slate-100">
          站点状态
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          在线
        </span>
      </div>

      <p className="mt-2 text-xs leading-6 text-slate-400">
        {runningDays > 0 ? (
          <>
            已运行 <span className="font-bold text-cyan-200">{runningDays}</span> 天
          </>
        ) : (
          <>今日上线，持续构建中</>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-white/[0.08] py-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block text-xl font-black text-white">{stat.value}</span>
              <span className="mt-0.5 block text-[10px] font-bold text-slate-500">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <ol className="relative mt-4 space-y-3.5 border-l border-white/10 pl-4">
        {milestones.map((item) => (
          <li key={item.label} className="relative">
            <span
              className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border ${
                item.active
                  ? "border-emerald-300/60 bg-emerald-400"
                  : "border-cyan-200/40 bg-cyan-300/70"
              }`}
            />
            <p className="text-xs font-bold text-slate-300">{item.label}</p>
            <time className="text-[10px] text-slate-500">{item.date}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
