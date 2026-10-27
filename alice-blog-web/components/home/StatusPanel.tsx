import { siteConfig } from "@/siteConfig";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(value)
    .replaceAll("/", ".");
}

export default function StatusPanel() {
  const launchDate = formatDate(new Date(siteConfig.buildDate));

  const events = [
    { label: "站点上线", date: launchDate, active: false },
    { label: "首页重构", date: "2026.10.26", active: false },
    { label: "视觉调整", date: "2026.10.27", active: false },
    { label: "持续构建", date: "进行中", active: true },
  ];

  return (
    <section className="acrylic-panel acrylic-panel--quiet px-5 py-6" aria-label="站点时间线">
      <ol className="relative space-y-5 border-l border-white/25 pl-4">
        {events.map((event) => (
          <li key={event.label} className="relative">
            <span
              className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                event.active
                  ? "bg-[var(--status-mint)]"
                  : "bg-white/65"
              }`}
              aria-hidden="true"
            />
            <p className="text-[13px] font-semibold text-white/95">{event.label}</p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              {event.date}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
