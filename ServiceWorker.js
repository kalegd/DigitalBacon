const digitalBaconCache = "digital-bacon-site-v0.0.1";
const assets = [
  "/",
  "/app",
  "/projects/default-project.zip",
  "/css/app.css",
  "/build/DigitalBacon.min.js",
  "/node_modules/three/build/three.module.js",
  "https://apis.google.com/js/api.js",
  "https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css",
];

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(digitalBaconCache).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request);
    })
  );
});
