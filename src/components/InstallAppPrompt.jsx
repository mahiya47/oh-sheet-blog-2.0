import { useEffect, useState } from "react";
import { usePwaInstall } from "../context/PwaInstallContext.jsx";

// Device-level (not per-account — installing is a browser/device thing,
// not tied to who's logged in) "last seen" timestamp — this keeps coming
// back once every 24h for as long as the app isn't installed, rather than
// being dismissed for good after one "Got it".
const LAST_SHOWN_KEY = "ohsheet-install-prompt-last-shown";
const REPROMPT_AFTER_MS = 24 * 60 * 60 * 1000;
// Give the browser's own `beforeinstallprompt` event (Android/Chrome —
// see PwaInstallContext) a moment to fire before deciding what to show.
// iOS Safari never fires it at all, so on iOS this delay is really just
// "wait a beat after load before interrupting them."
const SHOW_DELAY_MS = 1500;

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIos() {
  // iPadOS 13+ reports as "MacIntel" in the UA but is still touch-only —
  // maxTouchPoints catches that case too.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Shown once to a phone visitor who hasn't installed the app yet — offers
// a real one-tap install where the platform supports it (Android/Chrome,
// via the deferred beforeinstallprompt in PwaInstallContext), and clear
// step-by-step instructions where it doesn't (iOS Safari has no install
// API at all — "Add to Home Screen" only exists in its Share sheet).
// Mounted at the top level in App.jsx (both the bare and full-shell
// branches) so it works whether or not the visitor is logged in.
export default function InstallAppPrompt() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (installed) return;
    if (!isMobileDevice()) return;
    const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY)) || 0;
    if (Date.now() - lastShown < REPROMPT_AFTER_MS) return;
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [installed]);

  function dismiss() {
    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstallClick() {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    // Either choice spends the browser's one-shot prompt — asking again
    // this same visit would do nothing, so treat both as "handled."
    if (outcome) dismiss();
  }

  if (!visible || installed) return null;

  const ios = isIos();

  return (
    <div className="app-modal-overlay" onClick={dismiss}>
      <div className="app-modal app-install-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h3>Install Oh Sheet!</h3>
          <button type="button" className="app-modal-close" onClick={dismiss} aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal-body">
          {ios ? (
            <>
              <p>Add Oh Sheet! to your home screen for the full app feel — full-screen, faster, no address bar.</p>
              <ol className="app-install-steps">
                <li>
                  Tap the <strong>Share</strong> icon in Safari's toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top corner.
                </li>
              </ol>
              <button type="button" className="app-arcade-btn app-whatsnew-done" onClick={dismiss}>
                Got it
              </button>
            </>
          ) : canInstall ? (
            <>
              <p>Install Oh Sheet! on your phone for the full app feel — full-screen, faster, no address bar.</p>
              <button
                type="button"
                className="app-arcade-btn app-whatsnew-done"
                onClick={handleInstallClick}
                disabled={installing}
              >
                {installing ? "Installing..." : "Install app"}
              </button>
            </>
          ) : (
            <>
              <p>
                Add Oh Sheet! to your home screen: open your browser's menu and look for{" "}
                <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
              </p>
              <button type="button" className="app-arcade-btn app-whatsnew-done" onClick={dismiss}>
                Got it
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
