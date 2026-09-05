// The Oh Sheet! mark — a simple, thin-line cat face: round head, two
// small ears, dot eyes, tiny nose, whiskers.
export default function OhSheetLogo({ size = 22 }) {
  const line = {
    fill: "none",
    stroke: "#1c1810",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="26" r="14" {...line} />
      <path d="M12,17 Q15,6 19,16" {...line} />
      <path d="M29,16 Q33,6 36,17" {...line} />
      <circle cx="19" cy="25" r="1.5" fill="#1c1810" />
      <circle cx="29" cy="25" r="1.5" fill="#1c1810" />
      <path d="M22.5,29.5 L25.5,29.5 L24,31.5 Z" fill="#1c1810" />
      <path d="M21,33 Q24,35 27,33" {...line} />
      <path d="M14,29 L7,28" {...line} />
      <path d="M14,32 L7,33" {...line} />
      <path d="M34,29 L41,28" {...line} />
      <path d="M34,32 L41,33" {...line} />
    </svg>
  );
}
