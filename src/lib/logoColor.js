// The logo badge's color — a fixed lavender, matching the favicon,
// manifest theme color, and app icons. Used to be a random pick from a
// palette (which included a yellow close enough to Snapchat's ghost to
// get mistaken for it); a single settled color reads as this app's own
// mark instead.
export const logoColor = "#c4b5fd";

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
