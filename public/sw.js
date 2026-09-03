// Offline support: the app shell (so the installed app still opens with no
// connection) plus a "recently viewed" cache of feed/post reads (so you
// can keep scrolling what you've already seen). Everything else — logins,
// posting, DMs, votes, uploads, sockets — always goes straight to the
// network, same as before.
//
// Bump this when this file's caching logic changes in a way that should
// throw away what's stored (a corrupt cache is worse than an empty one) —
// the old-named caches get deleted on the next activate.
const CACHE_VERSION = "v1";
const SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;

// Paths (by extension/prefix) treated as the immutable app shell — Vite's
// hashed build output plus the icons/manifest, all cache-first since a new
// deploy simply produces new hashed filenames rather than changing these.
function isShellAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.svg"
  );
}

// Read-only feed/post endpoints worth caching for offline browsing. Explicit
// allowlist, GET-only — nothing that mutates state ever touches this cache.
const CACHEABLE_API_PATTERNS = [
  /^\/api\/posts$/,
  /^\/api\/posts\/following$/,
  /^\/api\/posts\/trending$/,
  /^\/api\/posts\/saved\/me$/,
  /^\/api\/posts\/user\/[^/]+$/,
  /^\/api\/posts\/tag\/[^/]+$/,
  /^\/api\/posts\/\d+$/,
  /^\/api\/posts\/\d+\/comments$/,
];

function isCacheableApiRequest(request, url) {
  return request.method === "GET" && CACHEABLE_API_PATTERNS.some((re) => re.test(url.pathname));
}

// Cheap, fast, non-cryptographic string hash (djb2) — just needs to tell
// "logged in as user A" apart from "logged in as user B" (or logged out) on
// a shared device, not resist tampering.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

// The feed/post responses above are personalized (myVote, isFollowedByMe,
// isMutedByMe, ...) — caching them by URL alone on a shared device would
// briefly leak one account's cached view to whoever logs in next. Folding
// a hash of the Authorization header into the cache key keeps each
// account's cached copies separate without an async crypto round-trip.
function cacheKeyFor(request) {
  const authHeader = request.headers.get("Authorization") || "anonymous";
  const url = new URL(request.url);
  url.searchParams.set("__swauth", hashString(authHeader));
  return new Request(url.toString(), { headers: request.headers });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest"]).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== SHELL_CACHE && n !== API_CACHE).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// Lets the page tell us to drop cached API responses on logout, so a
// different account logging in on the same device/browser never has a
// window where stale cached data from the previous account could show
// before revalidating. See lib/pwa.js's clearApiCache().
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_API_CACHE") {
    event.waitUntil(caches.delete(API_CACHE));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept mutations
  const url = new URL(request.url);

  // Full-page navigations: network first (so you always get the live app
  // when online), falling back to the cached shell when offline — this is
  // what makes "open the installed app with no connection" work at all.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match("/")) || Response.error();
      }),
    );
    return;
  }

  if (isShellAsset(url)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (isCacheableApiRequest(request, url)) {
    const key = cacheKeyFor(request);
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(key);
        // Stale-while-revalidate: serve the cached copy immediately if we
        // have one, and refresh it in the background either way.
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(key, response.clone());
            return response;
          })
          .catch(() => null);
        return cached || (await networkFetch) || Response.error();
      }),
    );
    return;
  }

  // Everything else (auth, posting, DMs, votes, media uploads, analytics,
  // socket.io) — untouched, straight to the network.
});

// Push notifications. The payload is whatever lib/push.js on the backend
// JSON.stringify'd into webpush.sendNotification() — { title, body, url }.
self.addEventListener("push", (event) => {
  let data = { title: "Oh Sheet!", body: "You have a new notification.", url: "/notifications" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Not JSON for some reason — fall back to the generic copy above
    // rather than dropping the notification entirely.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/notifications" },
    }),
  );
});

// Clicking the notification focuses an already-open tab if there is one,
// otherwise opens a new one — either way landing on the relevant post
// instead of just wherever the app happened to already be.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        if ("focus" in client) {
          client.postMessage({ type: "NAVIGATE", url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
