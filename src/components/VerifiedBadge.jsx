import { useId } from "react";

// Small tick badge shown next to a display name — only for accounts that
// have actually proved who they are. That means one of:
//   - they confirmed their email address, or
//   - they signed up with Google or GitHub, or
//   - they linked Google or GitHub to an existing account.
// All three set emailVerified on the server (see passport.js — every OAuth
// path flips it on), so that single flag is the whole check. Accounts that
// signed up with an email they never confirmed get no badge.
//
// Colours:
// - Gold: the creator account (id 5, @SourabhMahiya).
// - Rainbow: anyone who set their orientation to something other than
//   "straight" AND opted in via the showOrientation toggle (backend already
//   nulls out orientation for anyone who didn't opt in, so the check here
//   is just a safety net, not the actual privacy gate).
// - Blue: every other verified account.
export default function VerifiedBadge({ user, size = 14, className = "" }) {
  const gradId = useId();
  if (!user) return null;

  const isCreator = user.id === 5 && user.username === "SourabhMahiya";
  // The creator keeps the gold tick regardless; everyone else earns it.
  if (!isCreator && !user.emailVerified) return null;
  const isRainbow = !isCreator && !!user.showOrientation && !!user.orientation && user.orientation !== "straight";
  const variant = isCreator ? "creator" : isRainbow ? "rainbow" : "blue";
  const label = isCreator ? "Creator" : "Verified";
  const gradientId = `app-verified-rainbow-${gradId}`;

  return (
    <span
      className={`app-verified-badge app-verified-badge--${variant} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        {isRainbow && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff3b30" />
              <stop offset="20%" stopColor="#ff9500" />
              <stop offset="40%" stopColor="#ffcc00" />
              <stop offset="60%" stopColor="#34c759" />
              <stop offset="80%" stopColor="#0a84ff" />
              <stop offset="100%" stopColor="#af52de" />
            </linearGradient>
          </defs>
        )}
        <circle cx="10" cy="10" r="10" fill={isRainbow ? `url(#${gradientId})` : "currentColor"} />
        <path
          d="M6 10.4l2.5 2.5L14.3 6.9"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
