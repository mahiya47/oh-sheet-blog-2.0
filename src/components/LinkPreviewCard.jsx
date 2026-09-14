// Small card for the Open Graph preview scraped from a post's link.
export default function LinkPreviewCard({ preview, onClick }) {
  if (!preview || !preview.url) return null;

  let hostname = preview.siteName;
  if (!hostname) {
    try {
      hostname = new URL(preview.url).hostname.replace(/^www\./, "");
    } catch {
      hostname = preview.url;
    }
  }

  return (
    <a
      className="app-link-preview-card"
      href={preview.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={onClick}
    >
      {preview.image && (
        <div className="app-link-preview-image">
          <img src={preview.image} alt="" />
        </div>
      )}
      <div className="app-link-preview-body">
        <span className="app-link-preview-site">{hostname}</span>
        {preview.title && <span className="app-link-preview-title">{preview.title}</span>}
        {preview.description && (
          <span className="app-link-preview-desc">{preview.description}</span>
        )}
      </div>
    </a>
  );
}
