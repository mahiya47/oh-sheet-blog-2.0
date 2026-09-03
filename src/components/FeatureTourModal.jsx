import { useRef, useState } from "react";
import { TOUR_SLIDES } from "../lib/tourSlides.js";

const SWIPE_THRESHOLD_PX = 60;

// Full-screen swipeable carousel shown once to a brand-new user right
// after onboarding (see AppAnnouncementsGate.jsx). Swipe or use the dots/
// Next button — both work, since only a phone gives you the former.
export default function FeatureTourModal({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(null); // { startX } while a touch/drag is active

  const lastSlide = index === TOUR_SLIDES.length - 1;

  function goTo(next) {
    setIndex(Math.max(0, Math.min(TOUR_SLIDES.length - 1, next)));
  }

  function handlePointerDown(e) {
    dragging.current = { startX: e.clientX };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!dragging.current) return;
    setDragX(e.clientX - dragging.current.startX);
  }
  function endDrag() {
    if (!dragging.current) return;
    if (dragX <= -SWIPE_THRESHOLD_PX) goTo(index + 1);
    else if (dragX >= SWIPE_THRESHOLD_PX) goTo(index - 1);
    dragging.current = null;
    setDragX(0);
  }

  const trackStyle = {
    transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
    transition: dragging.current ? "none" : "transform 280ms ease",
  };

  return (
    <div className="app-modal-overlay">
      <div className="app-tour-modal">
        <div className="app-tour-top">
          <div className="app-tour-dots">
            {TOUR_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`app-tour-dot${i === index ? " is-active" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="app-tour-skip" onClick={onFinish}>
            Skip
          </button>
        </div>

        <div
          className="app-tour-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <div className="app-tour-track" style={trackStyle}>
            {TOUR_SLIDES.map((slide) => (
              <div className={`app-tour-slide app-card-${slide.color}`} key={slide.title}>
                <span className="app-tour-slide-emoji" aria-hidden="true">
                  {slide.emoji}
                </span>
                <h3 className="app-tour-slide-title">{slide.title}</h3>
                <p className="app-tour-slide-body">{slide.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="app-tour-nav">
          <button
            type="button"
            className="app-tour-back"
            onClick={() => goTo(index - 1)}
            style={{ visibility: index === 0 ? "hidden" : "visible" }}
          >
            Back
          </button>
          <button
            type="button"
            className="app-arcade-btn app-tour-next"
            onClick={() => (lastSlide ? onFinish() : goTo(index + 1))}
          >
            {lastSlide ? "Get started!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
