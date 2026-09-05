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
    `<circle cx="24" cy="24" r="22" fill="${color}" stroke="#1c1810" stroke-width="2.2"/>` +
    `<path d="M12,22 L8,8 L18,16" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M36,22 L40,8 L30,16" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<ellipse cx="18" cy="26" rx="2.3" ry="2.6" fill="#1c1810"/>` +
    `<ellipse cx="30" cy="26" rx="2.3" ry="2.6" fill="#1c1810"/>` +
    `<path d="M24,34 C20.5,30.5 21,27.5 24,29.3 C27,27.5 27.5,30.5 24,34 Z" fill="#1c1810"/>` +
    `<path d="M27,31 L41,27" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M27,33.5 L42,33.5" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M26,36 L40,40" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M21,31 L7,27" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M21,33.5 L6,33.5" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M22,36 L8,40" fill="none" stroke="#1c1810" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
