/* Keeps a copy of Bee Yard Wingman on the phone so it opens with no internet. */
const CACHE = "hivemind-fe1cb4584f92";
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
// the background when there's internet.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  // version.json (the update check) always comes fresh from the web.
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin || new URL(req.url).pathname.endsWith("/version.json")) { return; }
  // Other pages on the site (privacy/) aren't the app: straight from the web, and never saved over the app's copy.
  const home = new URL(self.registration.scope).pathname, at = new URL(req.url).pathname;
  if (req.mode === "navigate" && at !== home && at !== home + "index.html") { return; }
  const key = req.mode === "navigate" ? "./" : req;
  e.respondWith(caches.open(CACHE).then((cache) => cache.match(key, { ignoreSearch: true }).then((hit) => {
    const fresh = fetch(req).then((res) => {
      if (res && res.ok) { cache.put(key, res.clone()); }
      return res;
    }).catch(() => hit);
    return hit || fresh;
  })));
});
