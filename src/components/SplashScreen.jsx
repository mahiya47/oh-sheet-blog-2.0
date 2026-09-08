import { useEffect, useState } from "react";
import OhSheetLogo from "./OhSheetLogo.jsx";
import { appIconColor } from "../lib/logoColor.js";

const VISIBLE_MS = 1200;
const FADE_MS = 350;

// A branded splash shown for a moment right when the app opens —
// mirrors the installed PWA's own OS launch screen (icon centered on
// the brand background), but adds a small credit line at the bottom
// that the OS splash can't carry. Fades itself out and unmounts; it
// never blocks or delays the real app loading underneath it.
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    if (visible) return;
    const unmountTimer = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(unmountTimer);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className={"app-splash" + (visible ? "" : " is-hiding")} aria-hidden="true">
      <div className="app-splash-badge" style={{ background: appIconColor }}>
        <OhSheetLogo size={56} />
      </div>
      <div className="app-splash-credit">
        <span>From</span>
        <strong>Sourabh Mahiya</strong>
      </div>
    </div>
  );
}
