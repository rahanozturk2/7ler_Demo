// 7'ler - hal hatir sorma bildirimi gonderen Cloudflare Worker
//
// NEDEN VAR: FCM'e bildirim gonderebilmek icin servis hesabi anahtari gerekiyor.
// O anahtar tarayiciya konulamaz (koyarsak herkes birbirine bildirim yagdirir).
// Firebase'in kendi Cloud Functions'i kart istiyor; bu Worker ayni isi
// kartsiz ve ucretsiz yapiyor. Firebase Spark planinda kaliyoruz.
//
// KURULUM (Ra icin adim adim README.md dosyasinda).
//
// Beklenen istek:
//   POST /  { grupId, nabizId }   + Authorization: Bearer <Firebase ID token>
// Worker once cagiranin kimligini dogrular, sonra nabzi Firestore'dan okur,
// hedeflerin cihaz anahtarlarini bulur ve FCM'e bildirimi yollar.

export default {
  async fetch(istek, ortam) {
    if (istek.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))
    if (istek.method !== 'POST') return cors(yanit({ hata: 'yalnız POST' }, 405))

    try {
      const anahtar = JSON.parse(ortam.SERVIS_HESABI)
      const proje = anahtar.project_id

      // 1) Cagiran gercekten giris yapmis mi?
      const baslik = istek.headers.get('Authorization') || ''
      const idToken = baslik.replace(/^Bearer\s+/i, '')
      if (!idToken) return cors(yanit({ hata: 'kimlik yok' }, 401))

      const kimlik = await kimlikDogrula(idToken, ortam.WEB_API_KEY)
      if (!kimlik) return cors(yanit({ hata: 'kimlik geçersiz' }, 401))

      const { grupId, nabizId } = await istek.json()
      if (!grupId || !nabizId) return cors(yanit({ hata: 'eksik alan' }, 400))

      // 2) Servis hesabiyla yonetici erisim jetonu al
      const jeton = await erisimJetonu(anahtar)

      // 3) Nabzi ve grubu oku
      const nabiz = await belgeOku(proje, jeton, `gruplar/${grupId}/nabizlar/${nabizId}`)
      const grup = await belgeOku(proje, jeton, `gruplar/${grupId}`)
      if (!nabiz || !grup) return cors(yanit({ hata: 'bulunamadı' }, 404))

      const uyeler = dizi(grup.uyeler)
      // Gonderen gercekten bu nabzi atmis ve grubun uyesi mi?
      if (metin(nabiz.gonderen) !== kimlik.uid || !uyeler.includes(kimlik.uid)) {
        return cors(yanit({ hata: 'yetkisiz' }, 403))
      }

      const hedefler = (dizi(nabiz.hedefler).length ? dizi(nabiz.hedefler) : uyeler)
        .filter((u) => u !== kimlik.uid)

      // 4) Hedeflerin cihaz anahtarlarini topla
      const anahtarlar = []
      for (const uid of hedefler) {
        const cihazlar = await koleksiyonOku(proje, jeton, `kullanicilar/${uid}/cihazlar`)
        for (const c of cihazlar) {
          const a = metin(c.anahtar)
          if (a) anahtarlar.push(a)
        }
      }
      if (anahtarlar.length === 0) return cors(yanit({ gonderilen: 0, not: 'kayıtlı cihaz yok' }))

      // 5) FCM'e yolla
      const gonderenAd = metin(nabiz.gonderenAd) || 'Biri'
      const not = metin(nabiz.not)
      let gonderilen = 0
      for (const a of anahtarlar) {
        const ok = await fcmGonder(proje, jeton, a, {
          title: '7’ler',
          body: not ? `${gonderenAd} hal hatır sordu: “${not}”` : `${gonderenAd} hal hatır sordu`
        }, { grupId, nabizId })
        if (ok) gonderilen++
      }

      return cors(yanit({ gonderilen }))
    } catch (e) {
      return cors(yanit({ hata: String(e && e.message ? e.message : e) }, 500))
    }
  }
}

// ---------- Firestore REST yardimcilari ----------
const KOK = (p) => `https://firestore.googleapis.com/v1/projects/${p}/databases/(default)/documents`

async function belgeOku(proje, jeton, yol) {
  const y = await fetch(`${KOK(proje)}/${yol}`, { headers: { Authorization: `Bearer ${jeton}` } })
  if (!y.ok) return null
  const j = await y.json()
  return j.fields || null
}

async function koleksiyonOku(proje, jeton, yol) {
  const y = await fetch(`${KOK(proje)}/${yol}`, { headers: { Authorization: `Bearer ${jeton}` } })
  if (!y.ok) return []
  const j = await y.json()
  return (j.documents || []).map((d) => d.fields || {})
}

const metin = (alan) => (alan && alan.stringValue) || ''
const dizi = (alan) =>
  ((alan && alan.arrayValue && alan.arrayValue.values) || []).map((v) => v.stringValue || '')

// ---------- FCM ----------
async function fcmGonder(proje, jeton, hedef, bildirim, veri) {
  const y = await fetch(`https://fcm.googleapis.com/v1/projects/${proje}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: hedef,
        notification: bildirim,
        data: veri,
        webpush: { fcmOptions: { link: '/' } }
      }
    })
  })
  return y.ok
}

// ---------- Kimlik dogrulama ----------
// Firebase'in kendi uc noktasina soruyoruz; imza dogrulamayi elle yazmiyoruz.
async function kimlikDogrula(idToken, webApiKey) {
  const y = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  )
  if (!y.ok) return null
  const j = await y.json()
  const k = j.users && j.users[0]
  return k ? { uid: k.localId } : null
}

// ---------- Servis hesabi -> erisim jetonu (JWT imzalama) ----------
async function erisimJetonu(anahtar) {
  const simdi = Math.floor(Date.now() / 1000)
  const basaslik = { alg: 'RS256', typ: 'JWT' }
  const govde = {
    iss: anahtar.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: simdi,
    exp: simdi + 3600
  }

  const imzasiz = `${b64url(JSON.stringify(basaslik))}.${b64url(JSON.stringify(govde))}`
  const anahtarNesnesi = await crypto.subtle.importKey(
    'pkcs8',
    pemDen(anahtar.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const imza = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    anahtarNesnesi,
    new TextEncoder().encode(imzasiz)
  )
  const jwt = `${imzasiz}.${b64url(imza)}`

  const y = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  const j = await y.json()
  if (!j.access_token) throw new Error('erişim jetonu alınamadı: ' + JSON.stringify(j))
  return j.access_token
}

function pemDen(pem) {
  const govde = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const ham = atob(govde)
  const tampon = new Uint8Array(ham.length)
  for (let i = 0; i < ham.length; i++) tampon[i] = ham.charCodeAt(i)
  return tampon.buffer
}

function b64url(girdi) {
  const bayt =
    typeof girdi === 'string' ? new TextEncoder().encode(girdi) : new Uint8Array(girdi)
  let ikili = ''
  for (const b of bayt) ikili += String.fromCharCode(b)
  return btoa(ikili).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ---------- Ortak ----------
function yanit(govde, durum = 200) {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json' }
  })
}

function cors(y) {
  y.headers.set('Access-Control-Allow-Origin', '*')
  y.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  y.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return y
}
