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

const skills: { name: string; icon: LucideIcon }[] = [
  { name: "Java 21", icon: Coffee },
  { name: "Spring Boot", icon: Server },
  { name: "Spring Cloud", icon: Cloud },
  { name: "MySQL", icon: Database },
  { name: "Redis", icon: Zap },
  { name: "Docker", icon: Box },
  { name: "Git", icon: GitBranch },
  { name: "Next.js", icon: Layers },
  { name: "TypeScript", icon: FileCode },
  { name: "AI", icon: Sparkles },
];

export default function SkillsGrid() {
  return (
    <section className="cv-auto" aria-labelledby="skills-heading">
      <div className="mb-3">
        <h2 id="skills-heading" className="text-sm font-black tracking-widest text-slate-200">
          技能
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">当前使用的技术栈</p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {skills.map((skill) => {
          const Icon = skill.icon;

          return (
            <li
              key={skill.name}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0 text-cyan-300/80" aria-hidden="true" />
              <span className="truncate text-xs font-bold text-slate-300">{skill.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
