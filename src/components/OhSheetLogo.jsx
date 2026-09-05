// The Oh Sheet! mark — a stretching cat (sourabh's own sketch), redrawn
// in this site's line-art style: black outline, no fill, whiskers,
// curled tail, one paw reaching up and one resting on the ground.
export default function OhSheetLogo({ size = 22 }) {
  const line = {
    fill: "none",
    stroke: "#1c1810",
    strokeWidth: 6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg width={size} height={size} viewBox="28 28 220 220">
      <circle cx="205" cy="118" r="42" {...line} />
      <path d="M180,86 L172,54 L200,79" {...line} />
      <path d="M224,80 L238,49 L210,76" {...line} />
      <circle cx="188" cy="113" r="4.5" fill="#1c1810" />
      <circle cx="210" cy="109" r="4.5" fill="#1c1810" />
      <path d="M197,127 L203,127 L200,132 Z" fill="#1c1810" />
      <path d="M216,130 L247,126" {...line} />
      <path d="M216,136 L247,138" {...line} />
      <path d="M213,142 L241,150" {...line} />
      <path d="M172,148 C130,140 78,155 58,195 C48,216 54,238 76,242" {...line} />
      <path d="M76,242 C58,248 40,246 36,230 C33,218 44,210 53,217 C60,223 55,234 46,233" {...line} />
      <path d="M182,168 C150,190 118,206 100,224 C94,231 96,238 104,238" {...line} />
      <path d="M104,238 C132,238 162,232 184,222 C198,216 210,210 215,199" {...line} />
      <path d="M215,199 C221,193 230,193 234,200 C237,206 232,212 224,211" {...line} />
      <path d="M204,220 L210,211" {...line} />
      <path d="M212,224 L216,214" {...line} />
      <path d="M221,224 L223,215" {...line} />
      <path d="M170,150 C158,120 148,90 140,60" {...line} />
      <path d="M140,60 C133,52 132,42 140,36 C147,31 156,34 158,42 C160,49 154,55 146,53" {...line} />
      <path d="M122,46 L130,38" {...line} />
      <path d="M126,56 L133,48" {...line} />
      <path d="M134,62 L140,55" {...line} />
      <path d="M112,180 L112,190 M107,185 L117,185" stroke="#1c1810" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M100,202 L100,212 M95,207 L105,207" stroke="#1c1810" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
