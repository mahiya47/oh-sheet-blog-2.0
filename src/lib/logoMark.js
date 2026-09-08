// ============================================================
// SINGLE SOURCE OF TRUTH for the Oh Sheet! logo mark (the ghost).
//
// To change the logo: edit BODY_PATH / EYE_L / EYE_R / MOUTH_PATH
// below, then run `npm run icons` once. That regenerates the favicon
// and every PWA icon file automatically — nothing else needs to be
// touched by hand. The in-app mark (OhSheetLogo.jsx) and the live
// browser-tab favicon (logoColor.js) both read from this file too, so
// a shape/color change here shows up everywhere at once.
// ============================================================

export const LOGO_INK = "#1c1810";
export const LOGO_VIEWBOX = "0 0 48 48";

// The ghost silhouette: round dome top, four rounded scallops at the
// bottom.
export const BODY_PATH =
  "M9,22 A15,15 0 0 1 39,22 L39,34.5 Q35,42 31.5,34.5 Q28,42 24,34.5 Q20,42 16.5,34.5 Q12.5,42 9,34.5 Z";
export const EYE_L = { cx: 18, cy: 23, r: 2.1 };
export const EYE_R = { cx: 30, cy: 23, r: 2.1 };
export const MOUTH_PATH = "M19,29 Q24,32 29,29";

export const BODY_STROKE_WIDTH = 2.4;
export const MOUTH_STROKE_WIDTH = 2.2;

// Fixed color baked into the static app icon files (favicon, PWA
// icons, apple-touch-icon, theme-color meta tag). Those are fixed
// files, so they can't rotate with the random in-app badge color the
// way the live top-bar badge and tab icon do — they stay this one
// settled yellow, the site's primary accent.
export const APP_ICON_COLOR = "#f5c945";

/**
 * Inner SVG markup for the mark alone (no <svg> wrapper, no badge).
 * Shared by the React component and every SVG-string builder below.
 */
export function markInnerSVG(bodyFill = "#ffffff", outline = LOGO_INK) {
  return (
    `<path d="${BODY_PATH}" fill="${bodyFill}" stroke="${outline}" stroke-width="${BODY_STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${EYE_L.cx}" cy="${EYE_L.cy}" r="${EYE_L.r}" fill="${outline}"/>` +
    `<circle cx="${EYE_R.cx}" cy="${EYE_R.cy}" r="${EYE_R.r}" fill="${outline}"/>` +
    `<path d="${MOUTH_PATH}" fill="none" stroke="${outline}" stroke-width="${MOUTH_STROKE_WIDTH}" stroke-linecap="round"/>`
  );
}

/**
 * A full standalone SVG string: a round color badge behind the mark.
 * Used for the live favicon and every static PWA icon file.
 *
 *   size      — svg width/height in px (viewBox stays 0 0 48 48)
 *   badge     — badge background color
 *   bodyFill  — ghost fill color (default white)
 *   outline   — line color (default ink)
 *   fullBleed — fill the ENTIRE square with the badge color instead of
 *               a circle, and shrink the mark into the center "safe
 *               zone". Required for "maskable" PWA icons, which the OS
 *               can crop to any shape (circle, squircle, ...).
 */
export function buildBadgeSVG({
  size = 48,
  badge = APP_ICON_COLOR,
  bodyFill = "#ffffff",
  outline = LOGO_INK,
  fullBleed = false,
} = {}) {
  if (fullBleed) {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" width="${size}" height="${size}">` +
      `<rect x="0" y="0" width="48" height="48" fill="${badge}"/>` +
      `<g transform="translate(9.6,9.6) scale(0.6)">${markInnerSVG(bodyFill, outline)}</g>` +
      `</svg>`
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" width="${size}" height="${size}">` +
    `<circle cx="24" cy="24" r="22" fill="${badge}" stroke="${outline}" stroke-width="1.8"/>` +
    `${markInnerSVG(bodyFill, outline)}` +
    `</svg>`
  );
}
