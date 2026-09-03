// The Oh Sheet! mark — a small, cute ghost (a nod to the old logo),
// redrawn in this site's own style: bold black outline, rounded, a
// scalloped hem instead of a straight bottom, pink blush cheeks.
export default function OhSheetLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M8,24 A16,16 0 0 1 40,24 L40,36 A4,4 0 0 1 32,36 A4,4 0 0 1 24,36 A4,4 0 0 1 16,36 A4,4 0 0 1 8,36 Z"
        fill="#ffffff"
        stroke="#1c1810"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="18" cy="25" rx="2.4" ry="3" fill="#1c1810" />
      <ellipse cx="30" cy="25" rx="2.4" ry="3" fill="#1c1810" />
      <circle cx="14.5" cy="31" r="2" fill="#f6a8cd" />
      <circle cx="33.5" cy="31" r="2" fill="#f6a8cd" />
    </svg>
  );
}
