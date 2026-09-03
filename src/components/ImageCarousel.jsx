import { useRef, useState } from "react";

// A swipeable image carousel for multi-image posts (up to MAX_POST_IMAGES —
// see lib/postLimits.js). Pure CSS scroll-snap so it works with a plain
// touch swipe on mobile with no gesture library; the dots below just
// reflect (and let you jump to) whichever slide is currently snapped.
// A single-image post never reaches this component — FeedCard renders
// that case as a plain <img>, same as before this feature existed.
export default function ImageCarousel({ images, onClick }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(images.length - 1, index)));
  }

  function goTo(index) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActive(index);
  }

  if (!images.length) return null;

  return (
    <div className="app-carousel" onClick={onClick}>
      <div className="app-carousel-track" ref={trackRef} onScroll={handleScroll}>
        {images.map((src, i) => (
          <div className="app-carousel-slide" key={src + i}>
            <img src={src} alt={`Image ${i + 1} of ${images.length}`} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <div className="app-carousel-count">
            {active + 1}/{images.length}
          </div>
          <div className="app-carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={"app-carousel-dot" + (i === active ? " is-active" : "")}
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
