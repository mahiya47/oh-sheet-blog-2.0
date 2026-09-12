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
// - Bot: the two companion accounts (Pikku and Tonald) get their own
//   mark entirely — a squircle with a little robot in it, not a tick.
//   They post and comment on their own, so passing them off with the
//   same badge a person earns would be misleading.
// - Rainbow: anyone who set their orientation to something other than
//   "straight" AND opted in via the showOrientation toggle (backend already
//   nulls out orientation for anyone who didn't opt in, so the check here
//   is just a safety net, not the actual privacy gate).
// - Blue: every other verified account.
// Matched on username, the same way the server looks these accounts up
// (see bots.js — ids aren't stable across environments, usernames are).
const BOT_USERNAMES = ["pikkuthecat", "tonalddrump"];

export default function VerifiedBadge({ user, size = 14, className = "" }) {
  const gradId = useId();
  if (!user) return null;

  const isCreator = user.id === 5 && user.username === "SourabhMahiya";
  const isBot = BOT_USERNAMES.includes(String(user.username || "").toLowerCase());
  // The creator and the bots carry their mark regardless; everyone else
  // earns the tick by verifying.
  if (!isCreator && !isBot && !user.emailVerified) return null;
  const isRainbow =
    !isCreator && !isBot && !!user.showOrientation && !!user.orientation && user.orientation !== "straight";
  const variant = isBot ? "bot" : isCreator ? "creator" : isRainbow ? "rainbow" : "blue";
  const label = isBot ? "Automated account" : isCreator ? "Creator" : "Verified";
  const gradientId = `app-verified-grad-${gradId}`;

  // Every tick is a gradient rather than one flat fill — a single colour
  // reads as a cheap sticker at this size, where a light-to-dark sweep
  // reads like a minted badge. Gold is a bright yellow falling into amber
  // (the old antique gold looked more brown than gold against the app's
  // own yellows); blue runs from a light sky to a deep azure.
  const STOPS = {
    creator: ["#ffe770", "#ffc21c", "#f0a010"],
    blue: ["#63b6ff", "#2f8ae8", "#1665cc"],
    rainbow: ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#0a84ff", "#af52de"],
    // Teal — near none of the others, so a bot never reads as a verified
    // person out of the corner of your eye.
    bot: ["#9fe8d8", "#35b79c", "#1d8a76"],
  };
  const stops = STOPS[variant];

  return (
    <span
      className={`app-verified-badge app-verified-badge--${variant} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {stops.map((stopColor, k) => (
              <stop key={k} offset={`${(k / (stops.length - 1)) * 100}%`} stopColor={stopColor} />
            ))}
          </linearGradient>
        </defs>
        {isBot ? (
          <>
            {/* Squircle, not a circle — the shape alone says "this one is
                different" before you've registered the colour. */}
            <rect x="0" y="0" width="20" height="20" rx="6" fill={`url(#${gradientId})`} />
            <rect
              x="0.6"
              y="0.6"
              width="18.8"
              height="18.8"
              rx="5.6"
              fill="none"
              stroke="rgba(0,0,0,0.14)"
              strokeWidth="1.2"
            />
            {/* Aerial, head, and a pair of eyes. */}
            <circle cx="10" cy="3.1" r="1.05" fill="#fff" />
            <path d="M10 4.1v1.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="4.9" y="5.7" width="10.2" height="8.6" rx="2.6" fill="#fff" />
            <circle cx="7.9" cy="9.9" r="1.2" fill={stops[stops.length - 1]} />
            <circle cx="12.1" cy="9.9" r="1.2" fill={stops[stops.length - 1]} />
          </>
        ) : (
          <>
            <circle cx="10" cy="10" r="10" fill={`url(#${gradientId})`} />
            {/* A hairline keeps the tick from melting into a light
                background. */}
            <circle cx="10" cy="10" r="9.1" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1.2" />
            <path
              d="M6 10.4l2.5 2.5L14.3 6.9"
              fill="none"
              stroke="#fff"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </span>
  );
}
