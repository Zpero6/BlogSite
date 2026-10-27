/**
 * Generates the local, replaceable artwork used on the homepage site cards.
 *
 * Each entry gets a distinct semantic glyph on its own tinted glass sticker,
 * so the set does not read as the same face recoloured eleven times. Replace
 * a file or point `imageSrc` in NavigationGrid.tsx at new art when available.
 */
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "images", "nav");

const glyphs = {
  clock: `<circle cx="12" cy="12" r="7.5"/><path d="M12 7.5v5l3.2 2"/>`,
  folder: `<path d="M4 7.5A2 2 0 0 1 6 5.5h3.6l2 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>`,
  user: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5.2 19.5c0-3.8 3-6 6.8-6s6.8 2.2 6.8 6"/>`,
  chat: `<path d="M4.5 6.5h15v9.5H10l-4.2 3.2v-3.2H4.5Z"/>`,
  sparkle: `<path d="M12 4.2l1.9 5.9 5.9 1.9-5.9 1.9L12 19.8l-1.9-5.9L4.2 12l5.9-1.9Z" fill="currentColor" stroke="none"/>`,
  image: `<rect x="4.5" y="5.5" width="15" height="13" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="M5.5 17l4-4 2.8 2.8 2.2-2.2 4.5 4.4"/>`,
  note: `<path d="M9.2 18V6.2L17 4.5v11.3"/><circle cx="7.2" cy="18" r="2"/><circle cx="15" cy="15.8" r="2"/>`,
  link: `<path d="M10.2 13.8a4.6 4.6 0 0 0 6.5 0l1.9-1.9a4.6 4.6 0 0 0-6.5-6.5l-1 1"/><path d="M13.8 10.2a4.6 4.6 0 0 0-6.5 0l-1.9 1.9a4.6 4.6 0 0 0 6.5 6.5l1-1"/>`,
  heart: `<path d="M12 19.5S5.5 15.4 5.5 10.5A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 6.5 2.5c0 4.9-6.5 9-6.5 9Z" fill="currentColor" stroke="none"/>`,
  bell: `<path d="M6.5 17h11l-1.3-2.6V9.8a4.2 4.2 0 0 0-8.4 0v4.6Z"/><path d="M10 19.5h4"/>`,
  gear: `<circle cx="12" cy="12" r="2.8"/><path d="M12 4v2.4M12 17.6V20M4 12h2.4M17.6 12H20M6.3 6.3l1.7 1.7M16 16l1.7 1.7M17.7 6.3 16 8M8 16l-1.7 1.7"/>`,
};

const modules = [
  { name: "timeline", bg: ["#0e7490", "#082f49"], accent: "#67e8f9", glyph: "clock" },
  { name: "projects", bg: ["#4f46e5", "#1e1b4b"], accent: "#a5b4fc", glyph: "folder" },
  { name: "about", bg: ["#7c3aed", "#2e1065"], accent: "#d8b4fe", glyph: "user" },
  { name: "chatter", bg: ["#0f766e", "#042f2e"], accent: "#5eead4", glyph: "chat" },
  { name: "moments", bg: ["#b45309", "#451a03"], accent: "#fcd34d", glyph: "sparkle" },
  { name: "photowall", bg: ["#be185d", "#500724"], accent: "#f9a8d4", glyph: "image" },
  { name: "music", bg: ["#6d28d9", "#2e1065"], accent: "#c4b5fd", glyph: "note" },
  { name: "friends", bg: ["#0369a1", "#082f49"], accent: "#7dd3fc", glyph: "link" },
  { name: "favorites", bg: ["#9f1239", "#4c0519"], accent: "#fda4af", glyph: "heart" },
  { name: "notifications", bg: ["#a16207", "#422006"], accent: "#fde68a", glyph: "bell" },
  { name: "account", bg: ["#334155", "#0f172a"], accent: "#cbd5e1", glyph: "gear" },
];

function buildSvg(item) {
  const [bg1, bg2] = item.bg;
  const fillGlyph = item.glyph === "sparkle" || item.glyph === "heart";
  const glyphStyle = fillGlyph
    ? `color="${item.accent}"`
    : `stroke="${item.accent}" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.32" cy="0.22" r="0.82">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="4" y="4" width="112" height="112" rx="27" fill="url(#bg)"/>
  <rect x="4" y="4" width="112" height="112" rx="27" fill="url(#glow)"/>
  <rect x="4" y="4" width="112" height="112" rx="27" fill="none" stroke="#eaf6ff" stroke-opacity="0.17" stroke-width="2"/>
  <circle cx="60" cy="60" r="31" fill="#ffffff" fill-opacity="0.07"/>
  <g transform="translate(36 36) scale(2)" ${glyphStyle}>${glyphs[item.glyph]}</g>
  <circle cx="96" cy="24" r="2" fill="#ffffff" opacity="0.55"/>
  <circle cx="24" cy="94" r="1.6" fill="#ffffff" opacity="0.35"/>
</svg>
`;
}

await fs.mkdir(outputDir, { recursive: true });

for (const item of modules) {
  await fs.writeFile(path.join(outputDir, `${item.name}.svg`), buildSvg(item), "utf8");
}

console.log(`generated ${modules.length} semantic nav illustrations in ${outputDir}`);
