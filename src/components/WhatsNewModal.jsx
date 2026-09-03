import { CURRENT_APP_VERSION, WHATS_NEW_HIGHLIGHTS } from "../lib/appVersion.js";

// Shown once to a returning user whose stored "last seen" app version
// doesn't match CURRENT_APP_VERSION — including accounts that predate
// this feature entirely, which is exactly the "existing user after an
// update" case. See AppAnnouncementsGate.jsx for the decision logic.
export default function WhatsNewModal({ onClose }) {
  return (
    <div className="app-modal-overlay">
      <div className="app-modal app-whatsnew-modal">
        <div className="app-modal-head">
          <h3>What's new in Oh Sheet!</h3>
          <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal-body">
          <p className="app-whatsnew-version">Version {CURRENT_APP_VERSION}</p>
          <div className="app-whatsnew-list">
            {WHATS_NEW_HIGHLIGHTS.map((item) => (
              <div className="app-whatsnew-item" key={item.title}>
                <span className="app-whatsnew-emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.blurb}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="app-arcade-btn app-whatsnew-done" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
