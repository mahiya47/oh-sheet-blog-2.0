// Generates simple avatar/cover images as inline SVG data URIs, so the
// preset pickers in Settings work without shipping image assets or
// hitting the network. Stored directly as avatarUrl/coverUrl — every
// place in the app that renders those fields with a plain <img> or
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

export function buildAvatarDataUri(bgColor, initial) {
  const letter = (initial || "?").charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bgColor}"/>
    <text x="100" y="118" font-family="Nunito, sans-serif" font-size="90" font-weight="800"
      fill="#1c1810" text-anchor="middle">${letter}</text>
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
