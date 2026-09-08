import {
  LOGO_VIEWBOX,
  LOGO_INK,
  BODY_PATH,
  EYE_L,
  EYE_R,
  MOUTH_PATH,
  BODY_STROKE_WIDTH,
  MOUTH_STROKE_WIDTH,
} from "../lib/logoMark.js";

// The Oh Sheet! mark — a friendly ghost. The shape lives in
// lib/logoMark.js: edit it there to change the logo everywhere (this
// component, the live favicon, and every PWA icon file — run
// `npm run icons` after editing to regenerate the static icon files).
export default function OhSheetLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      <path
        d={BODY_PATH}
        fill="#ffffff"
        stroke={LOGO_INK}
        strokeWidth={BODY_STROKE_WIDTH}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={EYE_L.cx} cy={EYE_L.cy} r={EYE_L.r} fill={LOGO_INK} />
      <circle cx={EYE_R.cx} cy={EYE_R.cy} r={EYE_R.r} fill={LOGO_INK} />
      <path
        d={MOUTH_PATH}
        fill="none"
        stroke={LOGO_INK}
        strokeWidth={MOUTH_STROKE_WIDTH}
        strokeLinecap="round"
      />
    </svg>
  );
}
