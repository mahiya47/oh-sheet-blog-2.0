// Loading-state placeholders for every page that currently shows a plain
// "Loading..." line while its first fetch is in flight (Home, Trending,
// Leaderboard, Notifications, Messages, a message thread, and a
// profile). Each composite below mirrors the real component's shape —
// same avatar sizes, same row/card classes — so swapping the "Loading…"
// text for one of these doesn't shift the layout once real content
// arrives. The shimmer animation itself lives on .app-skeleton in
// index.css and reads from the same --app-* tokens as everything else,
// so it looks right in dark mode too without any extra work here.

// The base building block — a shimmering box. Give it a fixed
// width/height for a text-line stand-in, or `circle` for an avatar.
export function Skeleton({ width, height, radius, circle, style, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`app-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
    />
  );
}

// ---- Feed card (Home, Trending, and a profile's own posts) ----
export function FeedCardSkeleton() {
  return (
    <div className="app-skeleton-card">
      <div className="app-skeleton-card-head">
        <Skeleton circle width={22} height={22} />
        <Skeleton width={100} height={12} />
        <Skeleton width={36} height={10} />
      </div>
      <Skeleton width="100%" height={14} style={{ marginTop: 14 }} />
      <Skeleton width="88%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="55%" height={14} style={{ marginTop: 8 }} />
      <div className="app-skeleton-card-actions">
        <Skeleton width={54} height={26} radius={999} />
        <Skeleton width={54} height={26} radius={999} />
        <Skeleton width={54} height={26} radius={999} />
        <Skeleton width={30} height={26} radius={999} />
      </div>
    </div>
  );
}

export function FeedListSkeleton({ count = 4 }) {
  return (
    <div className="app-feed">
      {Array.from({ length: count }, (_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---- Leaderboard rows ----
export function LeaderboardSkeleton({ count = 6 }) {
  return (
    <ol className="app-leaderboard-list">
      {Array.from({ length: count }, (_, i) => (
        <li className="app-leaderboard-row" key={i}>
          <Skeleton width={16} height={16} />
          <Skeleton circle width={38} height={38} />
          <span className="app-skeleton-row-main">
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
          </span>
          <Skeleton width={44} height={14} />
        </li>
      ))}
    </ol>
  );
}

// ---- Notifications ----
export function NotificationsSkeleton({ count = 6 }) {
  return (
    <ul className="app-notif-list">
      {Array.from({ length: count }, (_, i) => (
        <li className="app-notif-item-row" key={i}>
          <div className="app-notif-item app-skeleton-row-flex">
            <Skeleton circle width={36} height={36} />
            <span className="app-skeleton-row-main">
              <Skeleton width="65%" height={12} />
              <Skeleton width="40%" height={10} style={{ marginTop: 6 }} />
            </span>
            <Skeleton width={28} height={10} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- DM conversation list ----
export function ConversationsSkeleton({ count = 6 }) {
  return (
    <ul className="app-dm-conv-list">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="app-dm-conv-row app-skeleton-row-flex">
            <Skeleton circle width={40} height={40} />
            <span className="app-skeleton-row-main">
              <Skeleton width="45%" height={12} />
              <Skeleton width="75%" height={10} style={{ marginTop: 6 }} />
            </span>
            <Skeleton width={28} height={10} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- A message thread's bubbles ----
export function MessageThreadSkeleton({ count = 5 }) {
  const widths = ["42%", "60%", "35%", "50%", "68%"];
  return (
    <div className="app-dm-bubbles">
      {Array.from({ length: count }, (_, i) => (
        <div className={"app-dm-bubble app-skeleton-bubble" + (i % 2 ? " is-mine" : "")} key={i}>
          <Skeleton width={widths[i % widths.length]} height={13} />
        </div>
      ))}
    </div>
  );
}

// ---- Profile header (cover, avatar, name/handle/bio) ----
export function ProfileHeaderSkeleton() {
  return (
    <div className="app-profile-page">
      <div className="app-skeleton-cover">
        <Skeleton width="100%" height="100%" radius={0} />
      </div>
      <div className="app-profile-main">
        <Skeleton
          width={88}
          height={88}
          radius="var(--app-radius-md)"
          style={{ marginTop: -44, border: "var(--app-border-w) solid var(--app-border)" }}
        />
        <Skeleton width={150} height={18} style={{ marginTop: 16 }} />
        <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
        <Skeleton width={220} height={12} style={{ marginTop: 10 }} />
      </div>
    </div>
  );
}
