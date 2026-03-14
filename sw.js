// ════════════════════════════════════════════════════════════════════════════
// CHANGE NAVIGATOR — Service Worker  (cnav-v10)
// ════════════════════════════════════════════════════════════════════════════
//
// Cache strategy:
//   HTML pages  → cnav-v10       Network-First (always fresh, cache as offline fallback)
//   CDN assets  → cnav-v10       Cache on first fetch, then Cache-First
//   Card images → cnav-cards-v1  Stale-While-Revalidate (Supabase Storage)
//     • Serves cached copy instantly (fast, works offline)
//     • Simultaneously fetches fresh version in background
//     • Cache is updated → next load picks up any admin changes automatically
//     • INVALIDATE_IMAGE message forces immediate eviction for a specific URL
//
// When you update the app, bump CACHE_NAME to force a refresh.
// Card images are in a separate cache so they survive app shell updates.
// ════════════════════════════════════════════════════════════════════════════

const CACHE_NAME  = 'cnav-v10';
const CARDS_CACHE = 'cnav-cards-v1';

// Local files that are always precached on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.html',
  '/cards-config.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js',
];

// ── Install: precache app shell ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches (keep CARDS_CACHE across versions) ────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CARDS_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: route requests to the right cache ──────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // ── Supabase Storage card images → Stale-While-Revalidate ───────────────
  // Serves the cached copy immediately (offline-capable), while fetching a
  // fresh copy in the background so admin uploads are visible on the next load.
  //
  // Fix notes:
  //  • response.ok || response.type==='opaque': <img> tags send no-cors requests
  //    which return opaque responses (status=0, ok=false). Without this check,
  //    images are never cached and every load is a cold network hit — fatal on
  //    mobile where the network can be slow or unavailable.
  //  • Response.error() instead of null: respondWith(null) is a TypeError in
  //    Android Chrome, causing a hard failure. Response.error() is the correct
  //    way to signal a network error while still triggering the img onerror.
  if (url.includes('supabase.co/storage')) {
    event.respondWith(
      caches.open(CARDS_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          // Always revalidate in the background (update cache silently)
          const revalidate = fetch(event.request).then(response => {
            // Cache both normal (ok) and opaque (no-cors img) responses
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => Response.error());

          // Serve cached copy instantly; fall through to network if no cache
          return cached || revalidate;
        })
      )
    );
    return;
  }

  // ── HTML navigation → Network-First ──────────────────────────────────────
  // Always fetch fresh HTML from the network so stale/broken cached pages
  // never block users. Falls back to cache only when truly offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        // Update the cache with the fresh response
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => caches.match(event.request) || caches.match('/app.html'))
    );
    return;
  }

  // ── Everything else → Cache-First, cache CDN assets on first hit ─────────
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cache CDN/font assets at runtime for future offline use
        const shouldCache =
          url.includes('cdn.tailwindcss.com') ||
          url.includes('fonts.googleapis.com') ||
          url.includes('fonts.gstatic.com') ||
          url.includes('cdn.jsdelivr.net');

        if (shouldCache) {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, response.clone())
          );
        }

        return response;
      }).catch(() => null);
    })
  );
});

// ── Messages from the page ────────────────────────────────────────────────────
// PREFETCH_DECK   — bulk-download all images for a language deck (offline prep)
// INVALIDATE_IMAGE — evict one specific image URL from cache (after admin upload)
self.addEventListener('message', event => {
  // App update: page asks the waiting SW to take over immediately
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Force-evict a single cached image so the next fetch gets fresh from Supabase
  if (event.data?.type === 'INVALIDATE_IMAGE') {
    const { url } = event.data;
    if (url) {
      event.waitUntil(
        caches.open(CARDS_CACHE).then(cache => cache.delete(url))
      );
    }
    return;
  }

  if (event.data?.type !== 'PREFETCH_DECK') return;

  // ── Background deck prefetch ────────────────────────────────────────────
  // Triggered by the app after the user picks a language.
  // Downloads all card images for that deck and stores them in CARDS_CACHE
  // so the app works fully offline on subsequent visits.
  //
  // Expected message payload: { type, lang, storageBase, bucket, total }
  // Progress/done messages are posted back to all open clients.

  const { lang, storageBase, bucket, total } = event.data;
  if (!storageBase || !bucket || !total) return;

  event.waitUntil((async () => {
    const cache = await caches.open(CARDS_CACHE);
    const totalUrls = total * 2; // front + back for each card
    let done = 0;

    // Build the full list of image URLs
    const urls = [];
    for (let i = 1; i <= total; i++) {
      urls.push(`${storageBase}/${bucket}/${i}F.png`);
      urls.push(`${storageBase}/${bucket}/${i}B.png`);
    }

    // Fetch in batches of 6 to stay within HTTP/2 multiplexing sweet-spot
    const BATCH = 6;
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = urls.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(url =>
          cache.match(url).then(hit => {
            if (hit) { done++; return; } // already cached — skip
            return fetch(url).then(r => {
              if (r && (r.ok || r.type === 'opaque')) cache.put(url, r);
            }).catch(() => {}).finally(() => { done++; });
          })
        )
      );

      // Broadcast progress percentage to all open clients
      const progress = Math.min(100, Math.round((done / totalUrls) * 100));
      const clients  = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({ type: 'PREFETCH_PROGRESS', lang, progress }));
    }

    // Signal completion
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'PREFETCH_DONE', lang }));
  })());
});
