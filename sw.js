/* Keeps a copy of HiveMind on the phone so it opens with no signal. */
const CACHE = "hivemind-ece12cad7c0e";
const FILES = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("hivemind-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Answer from the phone's copy straight away; refresh that copy from the web in
// the background when there's a signal.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  // version.json (the update check) always comes fresh from the web.
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin || new URL(req.url).pathname.endsWith("/version.json")) { return; }
  const key = req.mode === "navigate" ? "./" : req;
  e.respondWith(caches.open(CACHE).then((cache) => cache.match(key, { ignoreSearch: true }).then((hit) => {
    const fresh = fetch(req).then((res) => {
      if (res && res.ok) { cache.put(key, res.clone()); }
      return res;
    }).catch(() => hit);
    return hit || fresh;
  })));
});
