import { useEffect } from "react";

// A simple full-screen viewer for a single image — used to let a profile's
// avatar/cover photo "open fully" when clicked, instead of only ever being
// seen cropped into a small circle/banner.
export default function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="app-lightbox-overlay" onClick={onClose}>
      <button type="button" className="app-lightbox-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <img src={src} alt={alt || ""} className="app-lightbox-img" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
