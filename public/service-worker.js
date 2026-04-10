const CACHE_NAME = "couturevip-cache-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-1024x1024.png"
];

// Installation : cache des fichiers statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // 🔹 prend le contrôle immédiatement
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim(); // 🔹 contrôle immédiat des pages
});

// Fetch : cache-first pour assets, network-first pour API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🔹 Assets statiques
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // 🔹 API : network-first avec fallback cache
  if (url.pathname.startsWith("/clients") || url.pathname.startsWith("/mesures")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 🔹 Fallback général
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
