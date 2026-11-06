const CACHE_NAME = 'arxum-edu-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou que são de API/Banco
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return
  }

  // Network First, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clona e coloca no cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // Fallback para a página inicial se for uma navegação
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})