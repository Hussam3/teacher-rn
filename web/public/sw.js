/**
 * Service Worker لتطبيق الويب (حقيبة المدرس).
 *
 * سياسة التخزين المؤقت:
 *  - التنقّل و index.html: الشبكة أولاً (network-first) حتى يصلك آخر نشر فوراً
 *    عند أي فتح للصفحة، مع الرجوع للنسخة المخزّنة فقط عند انقطاع الشبكة.
 *  - بقية الأصول: من الذاكرة أولاً مع تحديث صامت في الخلفية
 *    (stale-while-revalidate).
 *  - version.json و sw.js: لا تُعالَجان إطلاقاً، فحص الإصدار يجب أن يذهب للشبكة
 *    دائماً وإلا لن يُكتشف أي تحديث جديد.
 *
 * اسم ذاكرة التخزين يحمل معرّف البناء، فتُحذف أصول النشر السابق تلقائياً عند
 * تفعيل البناء الجديد. تُستبدل `__BUILD_ID__` عند البناء (plugin web-build-info
 * في vite.config.ts).
 */
const BUILD_ID = '__BUILD_ID__';
const CACHE_PREFIX = 'teacher-bag-';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;

/** أصول ثابتة فقط؛ index.html ليس منها لأنه يُخدم من الشبكة أولاً. */
const PRECACHE_ASSETS = ['/favicon.png', '/logo.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNetworkOnly(pathname) {
  return pathname === '/version.json' || pathname === '/sw.js';
}

function isNavigation(request, pathname) {
  return request.mode === 'navigate' || pathname === '/index.html';
}

function putInCache(key, response) {
  const copy = response.clone();
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(key, copy))
    .catch(() => undefined);
}

/** الشبكة أولاً: أحدث نشر أولاً، والمخبأ شبكة أمان عند انقطاع الشبكة. */
async function networkFirst(request, cacheKey) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) putInCache(cacheKey, response);
    return response;
  } catch (error) {
    // طلبات التنقّل لا تُخزَّن كما هي، لذلك يُبحث عن النسخة المحفوظة بالمفتاح
    // الموحّد الذي كتبه networkFirst.
    const cached =
      (await caches.match(cacheKey)) || (await caches.match('/index.html'));
    if (cached) return cached;
    throw error;
  }
}

/** من الذاكرة أولاً مع تحديث صامت، فالتحميل فوري ويبقى محدثاً. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200) putInCache(request, response);
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const response = await network;
  if (response) return response;
  throw new Error('offline');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNetworkOnly(url.pathname)) return;

  event.respondWith(
    isNavigation(request, url.pathname)
      ? networkFirst(request, '/index.html')
      : staleWhileRevalidate(request),
  );
});
