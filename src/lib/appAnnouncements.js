// Per-browser, per-account tracking for the two onboarding announcements
// (the new-user feature tour and the returning-user "what's new" modal) —
// same convention as the arcade daily-streak keys: plain localStorage,
// scoped by username, no backend involved.
//
// How the two hand off to each other (see AppAnnouncementsGate.jsx):
//   - OnboardingPage marks a fresh signup's tour as "pending" right after
//     they finish setting up their profile.
//   - On their next app load, the gate sees the pending flag, shows the
//     full feature tour, then — since the tour already covers everything
//     current — stamps their seen-version as up to date too, so they
//     don't *also* get a "what's new" popup immediately after.
//   - Anyone else (an existing account, or one that predates this
//     feature entirely) just gets compared against CURRENT_APP_VERSION:
//     no match means "you're behind," so they get the what's-new modal
//     and are stamped current.
function scopedKey(kind, username) {
  return `ohsheet-${kind}-${username || "guest"}`;
}

export function isTourPending(username) {
  return localStorage.getItem(scopedKey("tour-pending", username)) === "1";
}

export function markTourPending(username) {
  localStorage.setItem(scopedKey("tour-pending", username), "1");
}

export function clearTourPending(username) {
  localStorage.removeItem(scopedKey("tour-pending", username));
}

export function getSeenAppVersion(username) {
  return localStorage.getItem(scopedKey("seen-version", username));
}

export function setSeenAppVersion(username, version) {
  localStorage.setItem(scopedKey("seen-version", username), version);
}
