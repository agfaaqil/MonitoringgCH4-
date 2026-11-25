const CACHE_NAME = "methra-v1";
const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon/219.jpeg",
  "icon/512.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // data Blynk jangan pernah di-cache
  if (url.hostname.includes("blynk.cloud")) return;

  // utamakan jaringan, cache hanya cadangan saat offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});