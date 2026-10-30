import { Code2, Sparkles } from "lucide-react";
import {
  siDocker,
  siGit,
  siMysql,
  siNextdotjs,
  siOpenjdk,
  siRedis,
  siSpring,
  siSpringboot,
  siTypescript,
} from "simple-icons";

const brandSkills = [
  { name: "Java 21", icon: siOpenjdk },
  { name: "Spring Boot", icon: siSpringboot },
  { name: "Spring Cloud", icon: siSpring },
  { name: "MySQL", icon: siMysql },
  { name: "Redis", icon: siRedis },
  { name: "Docker", icon: siDocker },
  { name: "Git", icon: siGit },
  { name: "Next.js", icon: siNextdotjs },
  { name: "TypeScript", icon: siTypescript },
];

export default function SkillsGrid() {
  return (
    <section className="cv-auto" aria-labelledby="skills-heading">
      <h2
        id="skills-heading"
        className="text-shadow-strong mb-3.5 flex items-center gap-2 text-[1.5rem] font-bold text-white"
      >
        <Code2 className="h-5 w-5 text-white/85" aria-hidden="true" />
        skills
      </h2>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-4">
        {brandSkills.map((skill) => {
          const isDarkBrand = skill.icon.hex === "000000";

          return (
            <li
              key={skill.name}
              title={skill.name}
              className="flex h-12 w-12 items-center justify-center"
            >
              <span className="sr-only">{skill.name}</span>
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="h-10 w-10 drop-shadow-[0_2px_6px_rgba(5,15,22,0.28)]"
                style={{ color: isDarkBrand ? "#f3f7fa" : `#${skill.icon.hex}` }}
              >
                <path d={skill.icon.path} fill="currentColor" />
              </svg>
            </li>
          );
        })}

        <li title="AI 应用" className="flex h-12 w-12 items-center justify-center">
          <span className="sr-only">AI 应用</span>
          <Sparkles
            className="h-10 w-10 text-violet-200 drop-shadow-[0_2px_6px_rgba(5,15,22,0.28)]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </li>
      </ul>
    </section>
  );
}
