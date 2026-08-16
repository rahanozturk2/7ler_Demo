import { db } from './firebase'
import {
  doc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, onSnapshot,
  query, where, orderBy, startAt, endAt, limit, arrayRemove, arrayUnion, serverTimestamp
} from 'firebase/firestore'

// ---- Olcekler: tablo bazinda secilir ----
export const OLCEKLER = [
  { id: '0-10',    ad: '0 – 10',    isaret: '10',  min: 0, max: 10,  adim: 1 },
  { id: 'yildiz5', ad: '5 yıldız',  isaret: '★',   min: 1, max: 5,   adim: 1 },
  { id: '0-100',   ad: '0 – 100',   isaret: '100', min: 0, max: 100, adim: 5 }
]

export function olcekBul(id) {
  return OLCEKLER.find((o) => o.id === id) || OLCEKLER[0]
}

export function kimlik() {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Math.floor(Math.random() * 1e9))
}

// ---- Sahip: tablolar ya bir kisinin ya bir grubun altinda durur ----
// { tur: 'kisi' | 'grup', id }
export const kisiSahip = (uid) => ({ tur: 'kisi', id: uid })
export const grupSahip = (grupId) => ({ tur: 'grup', id: grupId })

function tabloKok(sahip) {
  return sahip.tur === 'grup'
    ? collection(db, 'gruplar', sahip.id, 'tablolar')
    : collection(db, 'kullanicilar', sahip.id, 'tablolar')
}
const tabloRef = (sahip, tabloId) => doc(tabloKok(sahip), tabloId)
const satirKok = (sahip, tabloId) => collection(tabloRef(sahip, tabloId), 'satirlar')

// ---- Kullanici ----
export async function kullaniciyiKaydet(user) {
  const ad = user.displayName || ''
  await setDoc(
    doc(db, 'kullanicilar', user.uid),
    {
      ad,
      adKucuk: ad.toLocaleLowerCase('tr'),
      eposta: (user.email || '').toLowerCase(),
      foto: user.photoURL || '',
      sonGiris: serverTimestamp()
    },
    { merge: true }
  )
}

// Ada gore on-ek aramasi; '@' varsa dogrudan e-posta esitligi.
export async function kullaniciAra(metin, kendiUid) {
  const q = metin.trim().toLocaleLowerCase('tr')
  if (q.length < 2) return []

  const kok = collection(db, 'kullanicilar')
  const s = q.includes('@')
    ? query(kok, where('eposta', '==', q), limit(8))
    : query(kok, orderBy('adKucuk'), startAt(q), endAt(q + '\uf8ff'), limit(8))

  const snap = await getDocs(s)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.id !== kendiUid)
}

// ---- Tablolar ----
export function tablolariDinle(sahip, geriBildir, hataVer) {
  const s = query(tabloKok(sahip), orderBy('olusturma', 'asc'))
  return onSnapshot(
    s,
    (snap) => geriBildir(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    hataVer
  )
}

export async function tabloOlustur(sahip, { ad, olcek, ilkKolon }) {
  const kolonlar = ilkKolon?.trim() ? [{ id: kimlik(), ad: ilkKolon.trim() }] : []
  const ref = await addDoc(tabloKok(sahip), {
    ad: ad.trim(),
    olcek,
    kolonlar,
    olusturma: serverTimestamp()
  })
  return ref.id
}

export async function kolonlariYaz(sahip, tabloId, kolonlar) {
  await updateDoc(tabloRef(sahip, tabloId), { kolonlar })
}

// Grafik duzeni tabloda saklanir; her acilista varsayilana donmesin diye.
export async function grafikleriYaz(sahip, tabloId, grafikler) {
  await updateDoc(tabloRef(sahip, tabloId), { grafikler })
}

// Ortak tablo iki bicimde gosterilebilir:
//   'gun'   -> satir = gun, kolonlar = (kolon x uye)
//   'kayit' -> her kayit kendi satirinda, tarihin yaninda 'kim' kolonu
export async function gorunumYaz(sahip, tabloId, gorunum) {
  await updateDoc(tabloRef(sahip, tabloId), { gorunum })
}

export async function tabloSil(sahip, tabloId) {
  await deleteDoc(tabloRef(sahip, tabloId))
}

// ---- Satirlar ----
export function satirlariDinle(sahip, tabloId, geriBildir, hataVer) {
  const s = query(satirKok(sahip, tabloId), orderBy('zaman', 'desc'), limit(300))
  return onSnapshot(
    s,
    (snap) =>
      geriBildir(
        snap.docs.map((d) => {
          const v = d.data()
          // Firestore damgasini bilesenlerin dogrudan kullanabilecegi sayiya ceviriyoruz.
          return { id: d.id, ...v, zamanMs: v.zaman?.toDate ? v.zaman.toDate().getTime() : null }
        })
      ),
    hataVer
  )
}

// Grup tablosunda her kayit kimin girdigini tasir; kisisel tabloda da
// ayni alani yaziyoruz ki iki tarafta tek bir okuma yolu olsun.
export async function satirEkle(sahip, tabloId, uid, degerler) {
  await addDoc(satirKok(sahip, tabloId), {
    uid,
    zaman: serverTimestamp(),
    degerler
  })
}

export async function satirGuncelle(sahip, tabloId, satirId, degerler) {
  await updateDoc(doc(satirKok(sahip, tabloId), satirId), { degerler })
}

export async function satirSil(sahip, tabloId, satirId) {
  await deleteDoc(doc(satirKok(sahip, tabloId), satirId))
}

// Firestore damgasi ilk anda bos gelir; o an "simdi" gosteriyoruz.
export function tarihYaz(damga) {
  if (!damga) return 'şimdi'
  const t = damga.toDate ? damga.toDate() : new Date(damga)
  return t.toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

// ---- Gruplar ----
export function gruplariDinle(uid, geriBildir, hataVer) {
  const s = query(collection(db, 'gruplar'), where('uyeler', 'array-contains', uid))
  return onSnapshot(
    s,
    (snap) =>
      geriBildir(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // Bilesik dizin gerekmesin diye siralamayi burada yapiyoruz.
          .sort((a, b) => (a.olusturma?.seconds || 0) - (b.olusturma?.seconds || 0))
      ),
    hataVer
  )
}

export async function grupOlustur(kuran, diger, ad) {
  const ref = await addDoc(collection(db, 'gruplar'), {
    ad: ad.trim(),
    kuran: kuran.uid,
    uyeler: [kuran.uid, diger.id],
    // Uye adlarini burada da tutuyoruz; grup ekranini cizmek icin
    // her uyenin belgesini ayrica okumaya gerek kalmasin.
    uyeBilgi: {
      [kuran.uid]: { ad: kuran.displayName || '', foto: kuran.photoURL || '' },
      [diger.id]: { ad: diger.ad || '', foto: diger.foto || '' }
    },
    olusturma: serverTimestamp()
  })
  return ref.id
}

export async function grupAdiYaz(grupId, ad) {
  await updateDoc(doc(db, 'gruplar', grupId), { ad: ad.trim() })
}

export async function gruptanAyril(grupId, uid, kalanUyeSayisi) {
  // Son uye de cikiyorsa grubu bosuna birakma, sil.
  if (kalanUyeSayisi <= 1) await deleteDoc(doc(db, 'gruplar', grupId))
  else await updateDoc(doc(db, 'gruplar', grupId), { uyeler: arrayRemove(uid) })
}

// ---- Grafik varsayilanlari ----
// Kisisel tablo: her kolon icin bir grafik.
export function varsayilanGrafikler(kolonlar) {
  return (kolonlar || []).map((k) => ({
    id: 'g-' + k.id,
    seriler: [k.id],
    ymin: null, ymax: null, xbas: null, xson: null
  }))
}

// Grup tablosu: her kolon icin bir grafik, icinde TUM uyeler.
// Amac zaten karsilastirmak - "aynı gün kimin keyfi nasil".
export function varsayilanGrupGrafikleri(kolonlar, uyeler) {
  return (kolonlar || []).map((k) => ({
    id: 'g-' + k.id,
    seriler: (uyeler || []).map((uid) => uid + '|' + k.id),
    ymin: null, ymax: null, xbas: null, xson: null
  }))
}

// ---- Hal hatir sorma (nabiz) ----
// Gonderen bir kayit atar, digerleri onu canli dinler.
// Bildirimin kendisi Cloudflare Worker uzerinden FCM ile gider;
// uygulama acikken zaten bu kayit yeterli.
export async function nabizGonder(grupId, gonderen, hedefler, not_) {
  const ref = await addDoc(collection(db, 'gruplar', grupId, 'nabizlar'), {
    gonderen: gonderen.uid,
    gonderenAd: gonderen.displayName || '',
    hedefler,
    gorenler: [],
    not: (not_ || '').trim(),
    zaman: serverTimestamp()
  })
  return ref.id
}

// Son 24 saatteki nabizlar; eskiler ekrani mesgul etmesin.
export function nabizlariDinle(grupId, geriBildir, hataVer) {
  const s = query(collection(db, 'gruplar', grupId, 'nabizlar'), orderBy('zaman', 'desc'), limit(20))
  return onSnapshot(
    s,
    (snap) =>
      geriBildir(
        snap.docs.map((d) => {
          const v = d.data()
          return { id: d.id, ...v, zamanMs: v.zaman?.toDate ? v.zaman.toDate().getTime() : null }
        })
      ),
    hataVer
  )
}

// Nabzi SILMIYORUZ: dort kisilik bir grupta biri kapatinca digerlerinin
// seridi de kaybolurdu. Bunun yerine goren kisi kendi adini isaretliyor.
export async function nabizGoruldu(grupId, nabizId, uid) {
  await updateDoc(doc(db, 'gruplar', grupId, 'nabizlar', nabizId), {
    gorenler: arrayUnion(uid)
  })
}

export async function nabizSil(grupId, nabizId) {
  await deleteDoc(doc(db, 'gruplar', grupId, 'nabizlar', nabizId))
}

// Bildirim anahtarini kullanicinin altina yaziyoruz. Yalniz sahibi gorebilir;
// baskasina bildirim yollayacak olan sunucu tarafi servis hesabiyla okur.
export async function cihazKaydet(uid, anahtar, ad) {
  await setDoc(doc(db, 'kullanicilar', uid, 'cihazlar', anahtar.slice(0, 40)), {
    anahtar,
    ad: ad || '',
    guncelleme: serverTimestamp()
  })
}

// Bugun kim ne girmis? Grup ekranindaki "bugunku durum" seridi bunu kullanir.
export function bugunMu(zamanMs) {
  if (!zamanMs) return false
  const b = new Date()
  b.setHours(0, 0, 0, 0)
  return zamanMs >= b.getTime()
}
