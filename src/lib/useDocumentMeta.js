import { useEffect } from "react";

const DEFAULT_TITLE = "sourabh's sheets!";
const DEFAULT_DESCRIPTION = "A place to post your sheets, upvote the good ones, and follow along.";

function setMetaTag(attr, key, content) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

// Updates the tab title + description/OG/Twitter meta tags for the current
// page. Client-side only (no SSR here), so it helps search engines that
// execute JS (Google does) and any share-preview scraper that renders JS —
// classic non-JS scrapers (some older bots) won't see it, but this is a
// meaningful step up from a single static title for every page.
export function useDocumentMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const finalTitle = title ? `${title} — sourabh's sheets!` : DEFAULT_TITLE;
    const finalDescription = (description || DEFAULT_DESCRIPTION).slice(0, 200);

    document.title = finalTitle;
    setMetaTag("name", "description", finalDescription);
    setMetaTag("property", "og:title", finalTitle);
    setMetaTag("property", "og:description", finalDescription);
    setMetaTag("property", "og:type", "website");
    if (url) setMetaTag("property", "og:url", url);
    if (image) setMetaTag("property", "og:image", image);
    setMetaTag("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", finalTitle);
    setMetaTag("name", "twitter:description", finalDescription);
    if (image) setMetaTag("name", "twitter:image", image);

    // Reset to the site default when this page unmounts, so navigating
    // away doesn't leave a stale post's title/description behind.
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag("name", "description", DEFAULT_DESCRIPTION);
      setMetaTag("property", "og:title", DEFAULT_TITLE);
      setMetaTag("property", "og:description", DEFAULT_DESCRIPTION);
    };
  }, [title, description, image, url]);
}
