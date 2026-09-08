// A random light color for the logo badge, picked once per page load —
// reload the site and you get a different one. Also used to build the
// live browser-tab favicon so it matches the badge in the top bar.
import { buildBadgeSVG, APP_ICON_COLOR } from "./logoMark.js";

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
// tab icon do — they stay this one settled yellow. Re-exported here
// (defined once in logoMark.js) so nothing else needs to change if it
// ever does.
export const appIconColor = APP_ICON_COLOR;

export function buildFaviconHref(color) {
  return `data:image/svg+xml,${encodeURIComponent(buildBadgeSVG({ badge: color }))}`;
}
