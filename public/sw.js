// 7'ler - service worker
// Amac: uygulamayi telefona kurulabilir yapmak ve ag koptugunda kabugu acabilmek.
// Strateji AG ONCE: her zaman taze icerik gelir, ag yoksa onbellekten dusulur.
// Boylece "eski surum takildi kaldi" derdi olmuyor.

const ONBELLEK = 'yediler-v1'

self.addEventListener('install', (olay) => {
  self.skipWaiting()
  olay.waitUntil(
    caches.open(ONBELLEK).then((c) =>
      // Kok adres onbellege alinir ki cevrimdisi acilis calissin.
      c.addAll(['./', './manifest.json', './ikon-192.png']).catch(() => {})
    )
  )
})

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches
      .keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (olay) => {
  const istek = olay.request
  if (istek.method !== 'GET') return

  const url = new URL(istek.url)
  // Firestore / Google kimlik istekleri asla onbelleklenmez.
  if (url.origin !== self.location.origin) return

  olay.respondWith(
    fetch(istek)
      .then((yanit) => {
        const kopya = yanit.clone()
        caches.open(ONBELLEK).then((c) => c.put(istek, kopya)).catch(() => {})
        return yanit
      })
      .catch(async () => {
        const onbellekten = await caches.match(istek)
        if (onbellekten) return onbellekten
        // Sayfa gezintisiyse kabugu ver
        if (istek.mode === 'navigate') {
          const kok = await caches.match('./')
          if (kok) return kok
        }
        throw new Error('cevrimdisi')
      })
  )
})

// Sunucudan gelen itme bildirimi (Cloudflare Worker -> FCM -> buraya)
self.addEventListener('push', (olay) => {
  let veri = {}
  try { veri = olay.data ? olay.data.json() : {} } catch { veri = {} }

  const bildirim = veri.notification || {}
  const baslik = bildirim.title || '7’ler'
  const govde = bildirim.body || 'Hal hatır soruldu.'

  olay.waitUntil(
    self.registration.showNotification(baslik, {
      body: govde,
      icon: './ikon-192.png',
      badge: './ikon-192.png',
      tag: (veri.data && veri.data.grupId) || 'nabiz',
      data: veri.data || {}
    })
  )
})

// Bildirime dokununca uygulamayi ac, acik sekme varsa ona odaklan.
self.addEventListener('notificationclick', (olay) => {
  olay.notification.close()
  const veri = olay.notification.data || {}
  const hedef = new URL('./', self.location.href)
  if (veri.grupId) hedef.hash = 'grup=' + veri.grupId

  olay.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((pencereler) => {
      for (const p of pencereler) {
        if (p.url.startsWith(self.registration.scope)) {
          p.focus()
          p.postMessage({ tur: 'nabiz-acildi', ...veri })
          return
        }
      }
      return self.clients.openWindow(hedef.href)
    })
  )
})
