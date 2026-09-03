// A random light color for the logo badge, picked once per page load —
// reload the site and you get a different one. Also used to build the
// favicon so the browser tab matches the badge in the top bar.
const PALETTE = [
  "#a3e6a1", // green
  "#f5c945", // yellow
  "#f6a8cd", // pink
  "#a3d8f2", // blue
  "#f5b97a", // orange
  "#cdb3f2", // purple
  "#8fe3d0", // mint
  "#f2a6a6", // coral
];

export const logoColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];

export function buildFaviconHref(color) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<circle cx="24" cy="24" r="22" fill="${color}" stroke="#1c1810" stroke-width="2.4"/>` +
    `<path d="M8,24 A16,16 0 0 1 40,24 L40,36 A4,4 0 0 1 32,36 A4,4 0 0 1 24,36 A4,4 0 0 1 16,36 A4,4 0 0 1 8,36 Z" fill="#ffffff" stroke="#1c1810" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="18" cy="25" rx="2.4" ry="3" fill="#1c1810"/>` +
    `<ellipse cx="30" cy="25" rx="2.4" ry="3" fill="#1c1810"/>` +
    `<circle cx="14.5" cy="31" r="2" fill="#f6a8cd"/>` +
    `<circle cx="33.5" cy="31" r="2" fill="#f6a8cd"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
