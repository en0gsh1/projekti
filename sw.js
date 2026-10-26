// Service worker: rrjeti i pari, cache si rezervë (që faqja të hapet edhe offline)
const CACHE = "vizito-kosoven-v2";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./icon.svg",
  "./manifest.webmanifest",
  "./js/main.js",
  "./js/store.js",
  "./js/data.js",
  "./js/i18n.js",
  "./js/utils.js",
  "./js/actions.js",
  "./js/weather.js",
  "./js/map.js",
  "./js/views/explore.js",
  "./js/views/detail.js",
  "./js/views/map.js",
  "./js/views/plan.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const cacheable = url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com";
  if (e.request.method !== "GET" || !cacheable) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
