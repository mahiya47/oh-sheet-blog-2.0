// The Oh Sheet! mark — a minimal cat face: two simple fold-line ears,
// dot eyes, a tiny heart nose, and whiskers. No head outline, just
// these floating pieces — reads clean even very small.
export default function OhSheetLogo({ size = 22 }) {
  const line = {
    fill: "none",
    stroke: "#1c1810",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path d="M12,22 L8,8 L18,16" {...line} />
      <path d="M36,22 L40,8 L30,16" {...line} />
      <ellipse cx="18" cy="26" rx="2.3" ry="2.6" fill="#1c1810" />
      <ellipse cx="30" cy="26" rx="2.3" ry="2.6" fill="#1c1810" />
      <path d="M24,34 C20.5,30.5 21,27.5 24,29.3 C27,27.5 27.5,30.5 24,34 Z" fill="#1c1810" />
      <path d="M27,31 L41,27" {...line} />
      <path d="M27,33.5 L42,33.5" {...line} />
      <path d="M26,36 L40,40" {...line} />
      <path d="M21,31 L7,27" {...line} />
      <path d="M21,33.5 L6,33.5" {...line} />
      <path d="M22,36 L8,40" {...line} />
    </svg>
  );
}
