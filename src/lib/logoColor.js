// A random light color for the logo badge, picked once per page load —
// reload the site and you get a different one. Also used to build the
// live browser-tab favicon so it matches the badge in the top bar.
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

// The color baked into the STATIC app icon files — the default favicon
// (before JS swaps it), apple-touch-icon, the manifest icons, and the
// theme-color meta tag. Those are fixed files/values, so they can't
// rotate with the random badge color the way the live in-app badge and
// tab icon do — they stay this one settled yellow.
export const appIconColor = "#f5c945";

export function buildFaviconHref(color) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<circle cx="24" cy="24" r="22" fill="${color}" stroke="#1c1810" stroke-width="1.8"/>` +
    `<circle cx="24" cy="26" r="14" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M12,17 Q15,6 19,16" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M29,16 Q33,6 36,17" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="19" cy="25" r="1.5" fill="#1c1810"/>` +
    `<circle cx="29" cy="25" r="1.5" fill="#1c1810"/>` +
    `<path d="M22.5,29.5 L25.5,29.5 L24,31.5 Z" fill="#1c1810"/>` +
    `<path d="M21,33 Q24,35 27,33" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M14,29 L7,28" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M14,32 L7,33" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M34,29 L41,28" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M34,32 L41,33" fill="none" stroke="#1c1810" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
