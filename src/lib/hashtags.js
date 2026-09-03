// Shared hashtag + @mention helpers — used both by the live-highlighting
// composer and by the feed card that renders a post/comment's text with
// its tags and mentions styled.
const HASHTAG_PATTERN = /#[a-zA-Z0-9_]+/g;
// Same charset/length rule as the backend's mention parser (src/lib/mentions.js)
// — kept in sync manually since this is plain string parsing, not a shared package.
const MENTION_PATTERN = /@[a-zA-Z0-9_]{3,30}/g;
const COMBINED_PATTERN = /(#[a-zA-Z0-9_]+)|(@[a-zA-Z0-9_]{3,30})/g;

// Splits text into { text, tag } segments so a renderer can style the tag
// pieces differently (highlighting while typing, or linking once posted).
export function splitHashtags(text) {
  if (!text) return [{ text: "", tag: false }];
  const parts = [];
  let lastIndex = 0;
  const re = new RegExp(HASHTAG_PATTERN);
  let match;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), tag: false });
    }
    parts.push({ text: match[0], tag: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), tag: false });
  }
  return parts;
}

// The unique, lowercase, "#"-stripped set of hashtags typed in some text —
// what actually gets submitted to the API as the post's `tags`.
export function extractHashtags(text) {
  if (!text) return [];
  const found = text.match(HASHTAG_PATTERN) || [];
  return [...new Set(found.map((h) => h.slice(1).toLowerCase()))];
}

// Same idea as splitHashtags, but tags each segment as "hashtag", "mention",
// or null (plain text) — the general-purpose renderer/highlighter for any
// post or comment body, since both can contain either kind of token.
export function splitContent(text) {
  if (!text) return [{ text: "", type: null }];
  const parts = [];
  let lastIndex = 0;
  const re = new RegExp(COMBINED_PATTERN);
  let match;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), type: null });
    }
    parts.push({ text: match[0], type: match[0].startsWith("#") ? "hashtag" : "mention" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), type: null });
  }
  return parts;
}
