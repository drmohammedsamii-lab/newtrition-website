/* Newtrition service worker — الشبكة أولًا، والكاش احتياطي لو النت مقطوع.
   غيّر رقم CACHE مع كل نسخة جديدة عشان الكاش القديم يتمسح. بيانات العميل (localStorage) مش بتتأثر. */
const CACHE = 'newtrition-app-3.44';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
/* ملفات الأدوات (بتتحمّل عند الفتح). بنحمّلها في الخلفية بعد التثبيت عشان التطبيق يشتغل من غير نت من غير ما نبطّئ أول فتحة. */
const DATA = ['articles','exchange','exercise-guide','food-master','instructions','journal','meals','mizan','my-week','qa-bank','recipes','workout'].map(n => './data/' + n + '.bin?v=3.44');
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
  /* محاولة بأفضل جهد، من غير ما نعطّل التثبيت */
  caches.open(CACHE).then(c => Promise.allSettled(DATA.map(u => c.add(u))));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.indexOf('newtrition-app-') === 0).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
