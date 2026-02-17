// REPLAYD Service Worker
// Caches the shell for offline use; network-first for API/data.

const CACHE_NAME = "replayd-v1";

const SHELL_ASSETS = [
  "/",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and Supabase API calls
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  // Next.js RSC / API routes: network-first, no cache
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}
