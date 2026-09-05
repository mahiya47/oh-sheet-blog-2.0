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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -17 312 312">` +
    `<circle cx="141" cy="139" r="150" fill="${color}" stroke="#1c1810" stroke-width="8"/>` +
    `<circle cx="205" cy="118" r="42" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M180,86 L172,54 L200,79" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M224,80 L238,49 L210,76" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="188" cy="113" r="4.5" fill="#1c1810"/>` +
    `<circle cx="210" cy="109" r="4.5" fill="#1c1810"/>` +
    `<path d="M197,127 L203,127 L200,132 Z" fill="#1c1810"/>` +
    `<path d="M216,130 L247,126" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M216,136 L247,138" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M213,142 L241,150" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M172,148 C130,140 78,155 58,195 C48,216 54,238 76,242" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M76,242 C58,248 40,246 36,230 C33,218 44,210 53,217 C60,223 55,234 46,233" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M182,168 C150,190 118,206 100,224 C94,231 96,238 104,238" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M104,238 C132,238 162,232 184,222 C198,216 210,210 215,199" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M215,199 C221,193 230,193 234,200 C237,206 232,212 224,211" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M204,220 L210,211" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M212,224 L216,214" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M221,224 L223,215" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M170,150 C158,120 148,90 140,60" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M140,60 C133,52 132,42 140,36 C147,31 156,34 158,42 C160,49 154,55 146,53" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M122,46 L130,38" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M126,56 L133,48" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M134,62 L140,55" fill="none" stroke="#1c1810" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M112,180 L112,190 M107,185 L117,185" stroke="#1c1810" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M100,202 L100,212 M95,207 L105,207" stroke="#1c1810" stroke-width="3.5" stroke-linecap="round"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
