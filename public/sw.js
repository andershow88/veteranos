/* Veteranos service worker.
 * Strategy:
 *   - precache the offline shell and a couple of icons on install
 *   - cache-first for hashed Next.js static assets (long-lived)
 *   - network-first for HTML/Server-rendered pages and /api/*
 *   - bump CACHE_VERSION whenever you want to discard old caches
 */

const CACHE_VERSION = "veteranos-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        /* Ignore failures: e.g. manifest may have a different name. */
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET; let everything else (POST server actions, PUT, etc.) hit the network untouched.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't touch cross-origin requests.
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / RSC streaming in dev — the registration is gated to
  // production anyway, but defensive belt-and-braces here.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (request.headers.get("rsc")) return;

  // Network-first for API + HTML pages.
  const accept = request.headers.get("accept") ?? "";
  const isApi = url.pathname.startsWith("/api/");
  const isHtml = accept.includes("text/html");

  if (isApi || isHtml) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (Next.js hashed bundles, /public/* etc.).
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && (response.type === "basic" || response.type === "default")) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last-resort offline fallback for HTML navigation.
    if (request.headers.get("accept")?.includes("text/html")) {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    throw e;
  }
}

// ── Push Notifications ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Veteranos", body: "Match update!", url: "/" };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // fallback to defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
