// Generates simple avatar/cover images as inline SVG data URIs, so the
// preset pickers in Settings/Onboarding work without shipping image
// assets or hitting the network. Stored directly as avatarUrl/coverUrl —
// every place in the app that renders those fields with a plain <img> or
// background-image already works with this, no special-casing needed.

export const AVATAR_PRESET_COLORS = [
  "#f5c945", // yellow
  "#a3e6a1", // green
  "#f6a8cd", // pink
  "#a3d8f2", // blue
  "#cdb3f2", // purple
  "#f2a35c", // orange
  "#7fd6c0", // teal
  "#e0806f", // terracotta
];

export const COVER_PRESET_GRADIENTS = [
  ["#f5c945", "#f2a35c"],
  ["#a3e6a1", "#7fd6c0"],
  ["#f6a8cd", "#cdb3f2"],
  ["#a3d8f2", "#7fa8f2"],
  ["#cdb3f2", "#e0806f"],
  ["#f2a35c", "#e0806f"],
  ["#7fd6c0", "#a3d8f2"],
  ["#1c1810", "#6b6252"],
];

// A second "kind" of avatar preset — a playful emoji on a colored disc,
// for people who'd rather not use their initial.
export const AVATAR_PRESET_ICONS = [
  { icon: "🎮", bg: "#a3d8f2" },
  { icon: "🐱", bg: "#f6a8cd" },
  { icon: "🎲", bg: "#f5c945" },
  { icon: "☕", bg: "#e0806f" },
  { icon: "🎧", bg: "#cdb3f2" },
  { icon: "⚡", bg: "#f2a35c" },
  { icon: "👻", bg: "#7fd6c0" },
  { icon: "🌙", bg: "#1c1810" },
];

// A second "kind" of cover preset — a repeating pattern instead of a
// plain gradient.
export const COVER_PRESET_PATTERNS = [
  { pattern: "dots", bg: "#f5c945", fg: "#1c1810" },
  { pattern: "stripes", bg: "#a3e6a1", fg: "#1c1810" },
  { pattern: "grid", bg: "#a3d8f2", fg: "#1c1810" },
  { pattern: "waves", bg: "#f6a8cd", fg: "#1c1810" },
  { pattern: "dots", bg: "#cdb3f2", fg: "#f8f4ea" },
  { pattern: "stripes", bg: "#f2a35c", fg: "#1c1810" },
  { pattern: "grid", bg: "#7fd6c0", fg: "#1c1810" },
  { pattern: "waves", bg: "#1c1810", fg: "#6b6252" },
];

export function buildAvatarDataUri(bgColor, initial) {
  const letter = (initial || "?").charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bgColor}"/>
    <text x="100" y="118" font-family="Nunito, sans-serif" font-size="90" font-weight="800"
      fill="#1c1810" text-anchor="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Same idea as buildAvatarDataUri, but a fixed emoji instead of a letter.
export function buildIconAvatarDataUri(bgColor, icon) {
  const emoji = icon || "🙂";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bgColor}"/>
    <text x="100" y="128" font-family="Nunito, sans-serif" font-size="96"
      text-anchor="middle">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildCoverDataUri([from, to]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="240" fill="url(#g)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Builds one of a few repeating-pattern cover styles ("dots" | "stripes" |
// "grid" | "waves") tinted with a background + foreground color pair.
export function buildPatternCoverDataUri({ pattern, bg, fg }) {
  let patternBody;
  let size;
  if (pattern === "stripes") {
    size = 40;
    patternBody = `<path d="M-10 10 L10 -10 M0 40 L40 0 M30 50 L50 30" stroke="${fg}" stroke-width="10" opacity="0.35"/>`;
  } else if (pattern === "grid") {
    size = 40;
    patternBody = `<path d="M40 0 L0 0 0 40" fill="none" stroke="${fg}" stroke-width="2" opacity="0.35"/>`;
  } else if (pattern === "waves") {
    size = 60;
    patternBody = `<path d="M0 30 Q15 10 30 30 T60 30" fill="none" stroke="${fg}" stroke-width="4" opacity="0.35"/>`;
  } else {
    // dots
    size = 36;
    patternBody = `<circle cx="9" cy="9" r="5" fill="${fg}" opacity="0.35"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240">
    <defs>
      <pattern id="p" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
        ${patternBody}
      </pattern>
    </defs>
    <rect width="800" height="240" fill="${bg}"/>
    <rect width="800" height="240" fill="url(#p)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Combines every avatar "kind" into one pool so a person who skips
// picking one can still get a nice, varied result instead of a blank
// profile — used both by an explicit "surprise me" button and as a
// last-resort auto-fill right before saving.
export function pickRandomAvatarUrl(nameForInitial) {
  const letterCount = AVATAR_PRESET_COLORS.length;
  const total = letterCount + AVATAR_PRESET_ICONS.length;
  const pick = Math.floor(Math.random() * total);
  if (pick < letterCount) {
    return buildAvatarDataUri(AVATAR_PRESET_COLORS[pick], nameForInitial);
  }
  const { icon, bg } = AVATAR_PRESET_ICONS[pick - letterCount];
  return buildIconAvatarDataUri(bg, icon);
}

// Same idea as pickRandomAvatarUrl, for covers.
export function pickRandomCoverUrl() {
  const gradientCount = COVER_PRESET_GRADIENTS.length;
  const total = gradientCount + COVER_PRESET_PATTERNS.length;
  const pick = Math.floor(Math.random() * total);
  if (pick < gradientCount) {
    return buildCoverDataUri(COVER_PRESET_GRADIENTS[pick]);
  }
  return buildPatternCoverDataUri(COVER_PRESET_PATTERNS[pick - gradientCount]);
}
