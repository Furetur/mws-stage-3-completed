const CACHE_NAME = 'offlineCache';

const filesToCache = [
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'js/main.js',
  'js/restaurant.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js',
];

openCache = () => {
  return caches.open(CACHE_NAME);
}

respondToLocalRequest = (request) => {
  let _cache;
  return openCache().then(cache => {
    _cache = cache;
    return cache.match(request);
  }).then(cached => {
    if(cached) return cached;
    _cache.add(request).then(response => {
      console.log('cached:', request.url);
    }).catch(e => console.log(e))
    return fetch(request);
  })
}

respondToForeignRequest = (request) => {
  return openCache().then(cache => {
    return cache.match(request);
  }).then(cached => {
    return cached || fetch(request);
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    openCache().then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if(requestUrl.origin === location.origin) {
    // this domain
    event.respondWith(
      respondToLocalRequest(event.request)
    );
    return;
  }

  event.respondWith(
    respondToForeignRequest(event.request)
  );
});
