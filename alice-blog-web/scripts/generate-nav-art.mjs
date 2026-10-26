/**
 * Generates the local, replaceable artwork used on the homepage site cards.
 *
 * These are deliberately simple cat-sticker placeholders so every module has
 * a right-side image without borrowing any character art from the reference.
 * To use real artwork, replace the generated file or point `imageSrc` in
 * `components/home/NavigationGrid.tsx` at a new asset.
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
  { name: "timeline", bg: ["#0e7490", "#082f49"], hair: "#67e8f9", accent: "#22d3ee", glyph: "clock" },
  { name: "projects", bg: ["#4f46e5", "#1e1b4b"], hair: "#a5b4fc", accent: "#818cf8", glyph: "folder" },
  { name: "about", bg: ["#7c3aed", "#2e1065"], hair: "#d8b4fe", accent: "#c084fc", glyph: "user" },
  { name: "chatter", bg: ["#0f766e", "#042f2e"], hair: "#5eead4", accent: "#2dd4bf", glyph: "chat" },
  { name: "moments", bg: ["#b45309", "#451a03"], hair: "#fcd34d", accent: "#fbbf24", glyph: "sparkle" },
  { name: "photowall", bg: ["#be185d", "#500724"], hair: "#f9a8d4", accent: "#f472b6", glyph: "image" },
  { name: "music", bg: ["#6d28d9", "#2e1065"], hair: "#c4b5fd", accent: "#a78bfa", glyph: "note" },
  { name: "friends", bg: ["#0369a1", "#082f49"], hair: "#7dd3fc", accent: "#38bdf8", glyph: "link" },
  { name: "favorites", bg: ["#9f1239", "#4c0519"], hair: "#fda4af", accent: "#fb7185", glyph: "heart" },
  { name: "notifications", bg: ["#a16207", "#422006"], hair: "#fde68a", accent: "#facc15", glyph: "bell" },
  { name: "account", bg: ["#334155", "#0f172a"], hair: "#cbd5e1", accent: "#94a3b8", glyph: "gear" },
];

function buildSvg(item) {
  const [bg1, bg2] = item.bg;
  const strokeGlyph = ["sparkle", "heart"].includes(item.glyph)
    ? `color="${item.accent}"`
    : `stroke="${item.accent}" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.35" cy="0.25" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="4" y="4" width="112" height="112" rx="30" fill="url(#bg)"/>
  <rect x="4" y="4" width="112" height="112" rx="30" fill="url(#glow)"/>
  <rect x="4" y="4" width="112" height="112" rx="30" fill="none" stroke="#e5f6ff" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="92" cy="26" r="2.2" fill="#ffffff" opacity="0.55"/>
  <circle cx="26" cy="88" r="1.5" fill="#ffffff" opacity="0.35"/>

  <path d="M37 46 L33 24 L55 36 Z" fill="${item.hair}"/>
  <path d="M83 46 L87 24 L65 36 Z" fill="${item.hair}"/>
  <path d="M39 43 L37 31 L49 38 Z" fill="#f9a8c4" opacity="0.65"/>
  <path d="M81 43 L83 31 L71 38 Z" fill="#f9a8c4" opacity="0.65"/>
  <ellipse cx="60" cy="63" rx="29" ry="27" fill="#fff5e8"/>
  <path d="M32 51 Q39 31 60 30 Q81 31 88 51 Q77 41 60 41 Q43 41 32 51 Z" fill="${item.hair}" opacity="0.95"/>
  <ellipse cx="49" cy="61" rx="3.2" ry="4.4" fill="#172033"/>
  <ellipse cx="71" cy="61" rx="3.2" ry="4.4" fill="#172033"/>
  <circle cx="50.2" cy="59.8" r="1" fill="#ffffff"/>
  <circle cx="72.2" cy="59.8" r="1" fill="#ffffff"/>
  <circle cx="43" cy="69" r="3.4" fill="#f9a8c4" opacity="0.55"/>
  <circle cx="77" cy="69" r="3.4" fill="#f9a8c4" opacity="0.55"/>
  <path d="M56 69 Q60 73 64 69" fill="none" stroke="#172033" stroke-width="2" stroke-linecap="round"/>

  <circle cx="88" cy="88" r="17" fill="#08131f" stroke="${item.accent}" stroke-opacity="0.55" stroke-width="2"/>
  <g transform="translate(76 76)" ${strokeGlyph}>${glyphs[item.glyph]}</g>
</svg>
`;
}

await fs.mkdir(outputDir, { recursive: true });

for (const item of modules) {
  await fs.writeFile(path.join(outputDir, `${item.name}.svg`), buildSvg(item), "utf8");
}

console.log(`generated ${modules.length} nav illustrations in ${outputDir}`);
