import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { CURRENT_APP_VERSION } from "../lib/appVersion.js";
import { clearTourPending, getSeenAppVersion, isTourPending, setSeenAppVersion } from "../lib/appAnnouncements.js";
import FeatureTourModal from "./FeatureTourModal.jsx";
import WhatsNewModal from "./WhatsNewModal.jsx";

// Decides, once per app load, whether to show the new-user feature tour
// or the returning-user "what's new" modal — never both at once. Mounted
// once at the top of the logged-in app shell (see App.jsx), the same way
// IncomingChallengeModal is, so it's not tied to any one page.
export default function AppAnnouncementsGate() {
  const { user, loading } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (isTourPending(user.username)) {
      setShowTour(true);
      return;
    }
    if (getSeenAppVersion(user.username) !== CURRENT_APP_VERSION) {
      setShowWhatsNew(true);
    }
    // Only re-check when the logged-in account changes, not on every
    // render — showing one of these is itself a one-shot action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.username]);

  function finishTour() {
    clearTourPending(user.username);
    // The tour just covered everything current, so there's nothing new
    // left to tell them about right after it — mark them caught up.
    setSeenAppVersion(user.username, CURRENT_APP_VERSION);
    setShowTour(false);
  }

  function dismissWhatsNew() {
    setSeenAppVersion(user.username, CURRENT_APP_VERSION);
    setShowWhatsNew(false);
  }

  if (showTour) return <FeatureTourModal onFinish={finishTour} />;
  if (showWhatsNew) return <WhatsNewModal onClose={dismissWhatsNew} />;
  return null;
}
