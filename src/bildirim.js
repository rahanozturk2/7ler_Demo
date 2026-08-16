import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { app, auth } from './firebase'
import { cihazKaydet } from './veri'

// Firebase konsol -> Project settings -> Cloud Messaging -> Web configuration
// -> "Generate key pair" ile uretilen ACIK anahtar buraya gelecek.
// Bos oldugu surece bildirim izni istenmez, uygulama sessizce calismaya devam eder.
export const VAPID_ANAHTARI =
  'BHt1a8ZgxAF4fWS6MVInYQFQBAoSGWrLqjXMc5d3VId-RgR3aRbsOF3_7dNkMZikhZU_KiRjj6qso3Qa2VwPvXE'

// Cloudflare Worker adresi. Deploy edilince buraya yapistirilacak,
// ornegin: 'https://nabiz.rahanozturk2.workers.dev'
// Bos oldugu surece uygulama ici serit calisir, itme bildirimi gitmez.
export const WORKER_ADRESI = ''

// Nabiz kaydi atildiktan sonra bildirimi asil yollayan cagri.
// Kimlik jetonunu gonderiyoruz; Worker cagiranin gercekten o grubun
// uyesi oldugunu kendisi dogruluyor.
export async function nabizBildirimiYolla(grupId, nabizId) {
  if (!WORKER_ADRESI) return { gonderilen: 0, kurulmadi: true }

  const kullanici = auth.currentUser
  if (!kullanici) return { gonderilen: 0, hata: 'oturum yok' }

  try {
    const jeton = await kullanici.getIdToken()
    const y = await fetch(WORKER_ADRESI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton },
      body: JSON.stringify({ grupId, nabizId })
    })
    const j = await y.json().catch(() => ({}))
    if (!y.ok) return { gonderilen: 0, hata: j.hata || ('HTTP ' + y.status) }
    return j
  } catch (e) {
    // Bildirim gitmese de nabiz kaydi atildi; uygulama ici serit calisir.
    return { gonderilen: 0, hata: e.message }
  }
}

export function bildirimHazirMi() {
  return Boolean(VAPID_ANAHTARI) && 'Notification' in window && 'serviceWorker' in navigator
}

export function bildirimDurumu() {
  if (!('Notification' in window)) return 'desteklenmiyor'
  if (!VAPID_ANAHTARI) return 'kurulmadi'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// Izin ister, FCM anahtarini alir ve kullanicinin altina yazar.
// Anahtari yalniz sunucu tarafi okuyacak; baska kullanici goremez.
export async function bildirimleriAc(uid) {
  if (!VAPID_ANAHTARI) {
    throw new Error('VAPID anahtarı henüz girilmedi (src/bildirim.js).')
  }
  if (!(await isSupported())) {
    throw new Error('Bu tarayıcı web bildirimini desteklemiyor.')
  }

  const izin = await Notification.requestPermission()
  if (izin !== 'granted') throw new Error('Bildirim izni verilmedi.')

  // Service worker'i biz kaydediyoruz; FCM kendi dosyasini aramasin diye
  // hazir kaydi elle veriyoruz.
  const kayit = await navigator.serviceWorker.ready
  const anahtar = await getToken(getMessaging(app), {
    vapidKey: VAPID_ANAHTARI,
    serviceWorkerRegistration: kayit
  })
  if (!anahtar) throw new Error('Bildirim anahtarı alınamadı.')

  await cihazKaydet(uid, anahtar, cihazAdi())
  return anahtar
}

// Uygulama on plandayken gelen bildirimler service worker'a dusmez,
// buraya duser. Ekranda kendi seridimizi gostermek icin kullaniyoruz.
export async function onPlandaDinle(geriBildir) {
  if (!VAPID_ANAHTARI || !(await isSupported())) return () => {}
  return onMessage(getMessaging(app), geriBildir)
}

function cihazAdi() {
  const u = navigator.userAgent
  if (/iPhone|iPad/.test(u)) return 'iPhone'
  if (/Android/.test(u)) return 'Android'
  if (/Windows/.test(u)) return 'Windows'
  if (/Mac/.test(u)) return 'Mac'
  return 'cihaz'
}
