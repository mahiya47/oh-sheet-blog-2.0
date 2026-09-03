// Registers the service worker that makes the app installable, lets it
// work offline (see public/sw.js), and delivers push notifications.
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Browsers only allow service workers on HTTPS, with an explicit
  // exception for localhost during development.
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (window.location.protocol !== "https:" && !isLocalhost) return;

  // Clicking a push notification focuses this tab and posts back the post
  // (or /notifications) URL it should land on — see sw.js's
  // "notificationclick" handler. A full navigation is simplest here since
  // this fires outside of React's render tree.
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "NAVIGATE" && event.data.url) {
      window.location.assign(event.data.url);
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Not critical — the app works identically without it, it just
      // won't be installable in browsers that require one.
    });
  });
}

// base64url (the format PushManager wants) -> Uint8Array, needed because
// applicationServerKey has to be raw bytes, not the string VAPID_PUBLIC_KEY
// actually is.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Turns on push: asks the browser for notification permission, subscribes
// this browser with the PushManager, and hands the subscription to the
// backend to store. Returns the subscription on success, throws on denial
// or failure — the caller (Settings) decides how to surface that.
export async function subscribeToPush(publicKey) {
  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  return subscription.toJSON();
}

// Turns push back off for this browser — unsubscribes the PushManager
// locally so the browser stops holding onto it. The caller is still
// responsible for telling the backend to drop the stored subscription.
export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const endpoint = existing.endpoint;
    await existing.unsubscribe();
    return endpoint;
  }
  return null;
}

// Whether this browser currently has an active push subscription — used to
// set the Settings toggle correctly on load (e.g. after reinstalling the
// app, or on a second device that never subscribed).
export async function getExistingPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

// Tells the service worker to drop its cached feed/post responses — called
// on logout so a different account logging in on the same device never has
// a window where the previous account's cached data could flash on screen
// before revalidating. See public/sw.js's "message" listener.
export function clearApiCache() {
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_API_CACHE" });
}
