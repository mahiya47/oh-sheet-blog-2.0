import { Link } from "react-router-dom";

// Catch-all for any URL that doesn't match a real route — a typo'd
// link, an old bookmark, a deleted page. Keeps the same casual voice
// as the rest of the app instead of a bare browser error.
export default function NotFoundPage() {
  return (
    <div className="app-page app-notfound-page">
      <span className="app-notfound-emoji" aria-hidden="true">
        🫠
      </span>
      <h2 className="app-section-title">Oh sheet, this page doesn't exist</h2>
      <p className="app-empty">
        Whatever you were looking for isn't here — it might've been moved, deleted, or never
        existed in the first place.
      </p>
      <Link to="/" className="app-notfound-home">
        Take me home
      </Link>
    </div>
  );
}
