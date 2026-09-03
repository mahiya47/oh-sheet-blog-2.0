import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const PwaInstallContext = createContext(null);

function isRunningStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own (non-standard) flag for "opened from the home screen".
    window.navigator.standalone === true
  );
}

// Wraps the browser's "Add to home screen" flow so any page (currently just
// Settings > Appearance) can offer an explicit "Install app" button instead
// of relying on the browser's own, easy-to-miss install affordance.
export function PwaInstallProvider({ children }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(() => isRunningStandalone());
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      // Stops the browser's own mini-infobar/prompt so we can trigger it
      // ourselves later, from a button click.
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    }
    function onAppInstalled() {
      setInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return null;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    // The event can only be used once — whatever they chose, it's spent.
    deferredPromptRef.current = null;
    setCanInstall(false);
    // "accepted" is as good as installed for our purposes — the actual
    // `appinstalled` event usually follows moments later anyway, but
    // flipping this now keeps the Settings section (and its confirmation
    // message) from disappearing the instant canInstall goes false.
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome; // "accepted" | "dismissed"
  }, []);

  return (
    <PwaInstallContext.Provider value={{ canInstall, installed, promptInstall }}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error("usePwaInstall must be used inside <PwaInstallProvider>");
  return ctx;
}
