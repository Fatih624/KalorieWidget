// Network-only private app. Offline edits remain in the account-specific local
// draft while a page is open; reopening offline shows this non-personal fallback.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => new Response(`<!doctype html><html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Kalorie Coach · Offline</title><style>body{font:17px system-ui;background:#17243c;color:#eaf5ff;max-width:430px;margin:18vh auto;padding:24px;line-height:1.7}button{font:inherit;padding:12px 22px;border:0;border-radius:14px;background:#a2f6de;color:#183d47}</style><h1>Ein kurzer Offline-Moment.</h1><p>Bitte stelle die Verbindung wieder her, um dein privates Tagebuch zu öffnen. Bereits lokal gesicherte Einträge bleiben erhalten.</p><button onclick="location.reload()">Erneut verbinden</button></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })));
});
