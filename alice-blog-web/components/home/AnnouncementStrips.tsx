import { Lightbulb, Megaphone } from "lucide-react";

const strips = [
  {
    title: "站点公告",
    text: "文章、项目和开发记录会持续整理，欢迎常来看看。",
    icon: Megaphone,
    accent: "text-cyan-200",
    surface: "bg-cyan-300/10",
  },
  {
    title: "这里有什么",
    text: "Java 后端、分布式系统与 AI 应用的学习和实践记录。",
    icon: Lightbulb,
    accent: "text-emerald-200",
    surface: "bg-emerald-300/10",
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
            className="acrylic-strip flex items-start gap-3 px-3.5 py-3"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${strip.surface} ${strip.accent}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200">{strip.title}</p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{strip.text}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
