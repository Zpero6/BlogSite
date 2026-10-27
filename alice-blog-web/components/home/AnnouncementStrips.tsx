import { Lightbulb, Megaphone } from "lucide-react";

const strips = [
  {
    title: "站点公告",
    text: "文章、项目和开发记录会持续整理，欢迎常来看看。",
    icon: Megaphone,
    accent: "text-sky-100",
    border: "border-l-sky-300/75",
  },
  {
    title: "这里有什么",
    text: "Java 后端、分布式系统与 AI 应用的学习和实践记录。",
    icon: Lightbulb,
    accent: "text-emerald-100",
    border: "border-l-emerald-300/75",
  },
];

export default function AnnouncementStrips() {
  return (
    <section className="flex flex-col gap-2.5" aria-label="站点公告">
      {strips.map((strip) => {
        const Icon = strip.icon;

        return (
          <div
            key={strip.title}
            className={`acrylic-strip text-shadow-strong flex min-h-[60px] items-start gap-3 border-l-2 px-3.5 py-3 ${strip.border}`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${strip.accent}`}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white">{strip.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
                {strip.text}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
