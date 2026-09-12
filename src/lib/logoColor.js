// Fixed logo badge color — used to rotate randomly on every page load,
// now pinned to the site's yellow/mustard accent instead (matches
// --app-yellow in index.css). Also used to build the live browser-tab
// favicon so it matches the badge in the top bar.
import { buildBadgeSVG, APP_ICON_COLOR } from "./logoMark.js";

export const logoColor = "#F4D86B";

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
