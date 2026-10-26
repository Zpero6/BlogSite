import type { LucideIcon } from "lucide-react";
import {
  Box,
  Cloud,
  Coffee,
  Database,
  FileCode,
  GitBranch,
  Layers,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";

const skills: {
  name: string;
  icon: LucideIcon;
  color: string;
  background: string;
}[] = [
  { name: "Java 21", icon: Coffee, color: "text-orange-300", background: "bg-orange-400/10" },
  { name: "Spring Boot", icon: Server, color: "text-emerald-300", background: "bg-emerald-400/10" },
  { name: "Spring Cloud", icon: Cloud, color: "text-teal-300", background: "bg-teal-400/10" },
  { name: "MySQL", icon: Database, color: "text-sky-300", background: "bg-sky-400/10" },
  { name: "Redis", icon: Zap, color: "text-rose-300", background: "bg-rose-400/10" },
  { name: "Docker", icon: Box, color: "text-blue-300", background: "bg-blue-400/10" },
  { name: "Git", icon: GitBranch, color: "text-orange-200", background: "bg-orange-300/10" },
  { name: "Next.js", icon: Layers, color: "text-slate-100", background: "bg-white/[0.07]" },
  { name: "TypeScript", icon: FileCode, color: "text-blue-200", background: "bg-blue-300/10" },
  { name: "AI", icon: Sparkles, color: "text-violet-300", background: "bg-violet-400/10" },
];

export default function SkillsGrid() {
  return (
    <section className="cv-auto" aria-labelledby="skills-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="skills-heading" className="text-base font-black text-slate-100">
          技能
        </h2>
        <span className="text-[11px] text-slate-400">日常技术栈</span>
      </div>

      <ul className="flex flex-wrap gap-x-3 gap-y-5">
        {skills.map((skill) => {
          const Icon = skill.icon;

          return (
            <li
              key={skill.name}
              className="flex w-[70px] flex-col items-center gap-1.5"
              title={skill.name}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${skill.background} ${skill.color}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="w-full whitespace-nowrap text-center text-[9px] font-bold text-slate-400">
                {skill.name}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
