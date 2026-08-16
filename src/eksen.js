// Eksen tiklerini "guzel" sayilara ve "guzel" saatlere oturtan yardimcilar.

const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// ---------- Y ekseni ----------
// tamSayi=true iken 2.5 gibi kesirli adimlar elenir.
export function yTikleri(min, max, hedef = 5, tamSayi = false) {
  if (!(max > min)) return { tikler: [min], min, max: min + 1 }

  const adaylar = tamSayi ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]
  const ham = (max - min) / hedef
  const buyukluk = Math.pow(10, Math.floor(Math.log10(ham)))

  let adim = adaylar[adaylar.length - 1] * buyukluk * 10
  for (const a of adaylar) {
    const d = a * buyukluk
    if (d >= ham && (!tamSayi || d >= 1)) { adim = d; break }
  }

  const bas = Math.floor(min / adim) * adim
  const son = Math.ceil(max / adim) * adim
  const tikler = []
  for (let v = bas; v <= son + adim * 1e-6; v += adim) {
    tikler.push(Number(v.toFixed(6)))
  }
  return { tikler, min: bas, max: son }
}

export function yYaz(v) {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)))
}

// ---------- X ekseni (zaman) ----------
const DK = 60000
const SAAT = 60 * DK
const GUN = 24 * SAAT

// Gun altindaki adimlar hep gece yarisindan sayilir; boylece 02:00 gibi
// tuhaf tikler cikmaz, 00:00 / 06:00 / 12:00 gelir.
const ADIMLAR = [
  { ms: 5 * DK },   { ms: 15 * DK },  { ms: 30 * DK },
  { ms: SAAT },     { ms: 2 * SAAT }, { ms: 3 * SAAT }, { ms: 6 * SAAT }, { ms: 12 * SAAT },
  { ms: GUN },      { ms: 2 * GUN },  { ms: 3 * GUN },  { ms: 7 * GUN },  { ms: 14 * GUN },
  { ay: 1 },        { ay: 3 },        { ay: 6 },        { ay: 12 }
]

// { tikler, adimMs } dondurur; etiket bicimi adima gore secilir.
export function xTikleri(bas, son, hedef = 5) {
  const aralik = son - bas
  if (!(aralik > 0)) return { tikler: [bas], adimMs: SAAT }

  const adim =
    ADIMLAR.find((a) => aralik / (a.ms || a.ay * 30.44 * GUN) <= hedef) ||
    ADIMLAR[ADIMLAR.length - 1]

  const adimMs = adim.ms || adim.ay * 30.44 * GUN
  const tikler = adim.ay ? ayTikleri(bas, son, adim.ay) : msTikleri(bas, son, adim.ms)
  return { tikler, adimMs }
}

function msTikleri(bas, son, adim) {
  // Gece yarisina hizala, oradan adim adim ilerle
  const ilkGun = new Date(bas)
  ilkGun.setHours(0, 0, 0, 0)
  let t = ilkGun.getTime()
  while (t < bas) t += adim

  const cikti = []
  for (; t <= son && cikti.length < 12; t += adim) cikti.push(t)
  return cikti
}

function ayTikleri(bas, son, ayAdim) {
  const d = new Date(bas)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  while (d.getTime() < bas) d.setMonth(d.getMonth() + 1)

  const cikti = []
  while (d.getTime() <= son && cikti.length < 12) {
    cikti.push(d.getTime())
    d.setMonth(d.getMonth() + ayAdim)
  }
  return cikti
}

// Adim gun altindayken gece yarisi tiki saat yerine tarih gosterir;
// boylece "16 Agu | 12:00 | 17 Agu" gibi okunur bir eksen cikar.
export function xYaz(ms, adimMs) {
  const t = new Date(ms)

  if (adimMs >= 300 * GUN) return String(t.getFullYear())
  if (adimMs >= 27 * GUN) return AYLAR[t.getMonth()]
  if (adimMs >= GUN) return t.getDate() + ' ' + AYLAR[t.getMonth()]

  const geceYarisi = t.getHours() === 0 && t.getMinutes() === 0
  if (geceYarisi) return t.getDate() + ' ' + AYLAR[t.getMonth()]

  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
}

export function tamTarih(ms) {
  const t = new Date(ms)
  return (
    t.getDate() + ' ' + AYLAR[t.getMonth()] + ' ' +
    String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
  )
}

// <input type="date"> ile gidip gelmek icin
export function gunYaz(ms) {
  const t = new Date(ms)
  return (
    t.getFullYear() + '-' +
    String(t.getMonth() + 1).padStart(2, '0') + '-' +
    String(t.getDate()).padStart(2, '0')
  )
}

export function gunOku(metin, gunSonu = false) {
  if (!metin) return null
  const [y, a, g] = metin.split('-').map(Number)
  if (!y || !a || !g) return null
  return gunSonu
    ? new Date(y, a - 1, g, 23, 59, 59, 999).getTime()
    : new Date(y, a - 1, g, 0, 0, 0, 0).getTime()
}
