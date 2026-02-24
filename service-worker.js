const CACHE_NAME = "sheetmusic-cache-v2";
const ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./db.js",
    "./ui.js",
    "./manifest.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith("sheetmusic-cache-") && key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((resp) => resp || fetch(event.request))
    );
});
