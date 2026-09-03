import { Link, useNavigate } from "react-router-dom";
import { splitContent } from "../lib/hashtags.js";

// Renders a post or comment's text with #hashtags linked to that tag's
// feed (/tag/:name) and @mentions linked to that person's profile.
//
// `html` (a post's contentHtml) takes over rendering entirely when
// present — it's already sanitized and hashtag/mention-linked server-side
// (see the backend's lib/richText.js), so it's safe to drop in directly.
// Comments and older/plain-text posts never have one and fall through to
// the regex-based plain-text rendering below, unchanged.
export default function PostText({ text, html, className = "app-card-text", onClick }) {
  const navigate = useNavigate();

  // The hashtag/mention <a> tags baked into `html` by the backend are
  // plain anchors pointing at same-origin app routes ("/tag/...",
  // "/profile/...") — unlike the plain-text path below, which links them
  // with react-router's <Link> for client-side navigation, a raw <a> click
  // does a full browser navigation: a hard page reload, losing all app
  // state, just to go to a route this same SPA already handles. This
  // intercepts only those same-origin, same-tab links (an external link a
  // user added via the formatting toolbar's Link button opens in a new tab
  // via target="_blank" and is left to the browser, same as always) and
  // routes them through react-router instead.
  function handleRichClick(e) {
    const anchor = e.target.closest("a");
    if (anchor && !anchor.target) {
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("/")) {
        e.preventDefault();
        e.stopPropagation();
        navigate(href);
        return;
      }
    }
    onClick?.(e);
  }

  if (html) {
    return (
      // eslint-disable-next-line react/no-danger
      <div className={className} onClick={handleRichClick} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  const segments = splitContent(text || "");
  return (
    <p className={className} onClick={onClick}>
      {segments.map((seg, i) => {
        if (seg.type === "hashtag") {
          return (
            <Link
              key={i}
              to={`/tag/${encodeURIComponent(seg.text.slice(1).toLowerCase())}`}
              className="app-card-hashtag"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.text}
            </Link>
          );
        }
        if (seg.type === "mention") {
          return (
            <Link
              key={i}
              to={`/profile/${encodeURIComponent(seg.text.slice(1))}`}
              className="app-card-mention"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.text}
            </Link>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </p>
  );
}
