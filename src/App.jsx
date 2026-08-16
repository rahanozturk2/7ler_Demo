import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { VARSAYILAN, temaBul, temayiUygula } from './temalar'
import {
  kullaniciyiKaydet, tablolariDinle, tabloOlustur,
  kolonlariYaz as kolonlariYazVeri, tabloSil, olcekBul,
  gruplariDinle, grupOlustur, kisiSahip, grupSahip
} from './veri'
import Kutucuk from './Kutucuk'
import Ayarlar from './Ayarlar'
import TabloYeni from './TabloYeni'
import Tablo from './Tablo'
import GrupYeni from './GrupYeni'
import Grup from './Grup'
import Sayfa from './Sayfa'

const TEMA_ANAHTAR = 'yediler.tema'

export default function App() {
  const [user, setUser] = useState(null)
  const [hazir, setHazir] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState(null)
  const [ekran, setEkran] = useState('ana')     // 'ana' | 'sayfam' | 'tablo' | 'grup'
  const [panel, setPanel] = useState(null)      // 'ayarlar' | 'ekle' | 'tablo-yeni'
  const [tema, setTema] = useState(() => localStorage.getItem(TEMA_ANAHTAR) || VARSAYILAN)
  const [tablolar, setTablolar] = useState([])
  const [gruplar, setGruplar] = useState([])
  const [grupTablolar, setGrupTablolar] = useState([])
  const [seciliId, setSeciliId] = useState(null)
  const [seciliGrupId, setSeciliGrupId] = useState(null)
  const [seciliGrupTabloId, setSeciliGrupTabloId] = useState(null)
  // Nabiza dokunulunca ortak tablo acilip dogrudan kayit ekrani gelsin.
  const [hemenKayit, setHemenKayit] = useState(false)

  const seciliTablo = tablolar.find((t) => t.id === seciliId) || null
  const seciliGrup = gruplar.find((g) => g.id === seciliGrupId) || null
  const seciliGrupTablo = grupTablolar.find((t) => t.id === seciliGrupTabloId) || null

  useEffect(() => { temayiUygula(temaBul(tema)) }, [tema])

  useEffect(() => {
    getRedirectResult(auth).catch((e) => setHata(cevirHata(e)))
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setHazir(true)
      setMesgul(false)
      if (u) kullaniciyiKaydet(u).catch(() => {})
      else { setEkran('ana'); setTablolar([]); setGruplar([]) }
    })
  }, [])

  // Tablolar ve gruplar canli dinleniyor: baska cihazdan degisen buraya da duser.
  useEffect(() => {
    if (!user) return
    return tablolariDinle(kisiSahip(user.uid), setTablolar, (e) =>
      setHata('Tablolar okunamadı: ' + e.code)
    )
  }, [user])

  useEffect(() => {
    if (!user) return
    return gruplariDinle(user.uid, setGruplar, (e) =>
      setHata('Gruplar okunamadı: ' + e.code)
    )
  }, [user])

  // Secili grubun ortak tablolari
  useEffect(() => {
    if (!seciliGrupId) { setGrupTablolar([]); return }
    return tablolariDinle(grupSahip(seciliGrupId), setGrupTablolar, (e) =>
      setHata('Ortak tablolar okunamadi: ' + e.code)
    )
  }, [seciliGrupId])

  // Acik olan tablo ya da grup silinirse geriye don.
  useEffect(() => {
    if (ekran === 'tablo' && seciliId && !seciliTablo) setEkran('sayfam')
    if (ekran === 'grup' && seciliGrupId && !seciliGrup) setEkran('ana')
    if (ekran === 'gruptablo' && seciliGrupTabloId && !seciliGrupTablo) setEkran('grup')
  }, [ekran, seciliId, seciliTablo, seciliGrupId, seciliGrup, seciliGrupTabloId, seciliGrupTablo])

  function temaSec(id) {
    setTema(id)
    localStorage.setItem(TEMA_ANAHTAR, id)
  }

  async function girisYap() {
    setHata(null)
    setMesgul(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (POPUP_OLMAZ.includes(e.code)) {
        try { await signInWithRedirect(auth, googleProvider); return }
        catch (e2) { setHata(cevirHata(e2)) }
      } else {
        setHata(cevirHata(e))
      }
      setMesgul(false)
    }
  }

  async function cikisYap() {
    setPanel(null)
    setEkran('ana')
    await signOut(auth)
  }

  async function seciliyiSil() {
    if (!confirm(seciliTablo.ad + ' tablosu silinsin mi?')) return
    await tabloSil(kisiSahip(user.uid), seciliTablo.id)
    setEkran('sayfam')
  }

  async function grupTablosunuSil() {
    const soru = seciliGrupTablo.ad + ' ortak tablosu silinsin mi? Grubun tamami icin silinir.'
    if (!confirm(soru)) return
    await tabloSil(grupSahip(seciliGrupId), seciliGrupTablo.id)
    setEkran('grup')
  }

  function geriGit() {
    if (ekran === 'tablo') setEkran('sayfam')
    else if (ekran === 'gruptablo') setEkran('grup')
    else setEkran('ana')
  }

  const { baslik, altBaslik } = basliklar(ekran, user, seciliTablo, seciliGrup, seciliGrupTablo)
  const govdeEkrani = ekran === 'tablo' || ekran === 'grup' || ekran === 'gruptablo'

  return (
    <div className="app">
      <div className="bg" aria-hidden="true">
        <span className="leke l1" />
        <span className="leke l2" />
        <span className="leke l3" />
      </div>

      {ekran !== 'ana' && (
        <button className="geri" onClick={geriGit} aria-label="Geri">‹</button>
      )}

      <header className="brand">
        <div className="mark">{isaret(ekran, seciliTablo, seciliGrup, seciliGrupTablo)}</div>
        <h1>{baslik}</h1>
        <p className="slogan">{altBaslik}</p>
      </header>

      <main className={govdeEkrani ? 'govde' : 'kutucuklar'}>
        {!hazir && <div className="kutucuk iskelet" />}

        {hazir && !user && (
          <Kutucuk ikon="↪" ad={mesgul ? 'AÇILIYOR' : 'GİRİŞ'} onClick={girisYap} disabled={mesgul} />
        )}

        {hazir && user && ekran === 'ana' && (
          <>
            <Kutucuk ikon="◔" ad="SAYFAM" onClick={() => setEkran('sayfam')} />
            {gruplar.map((g) => (
              <Kutucuk
                key={g.id}
                ikon="◎"
                ad={g.ad.toLocaleUpperCase('tr')}
                onClick={() => { setSeciliGrupId(g.id); setEkran('grup') }}
              />
            ))}
            <Kutucuk ikon="+" ad="EKLE" tur="bos" onClick={() => setPanel('ekle')} />
          </>
        )}

        {hazir && user && ekran === 'sayfam' && (
          <>
            <Kutucuk ikon="✦" ad="AYARLAR" onClick={() => setPanel('ayarlar')} />
            {tablolar.map((t) => (
              <Kutucuk
                key={t.id}
                ikon="◈"
                ad={t.ad.toLocaleUpperCase('tr')}
                onClick={() => { setSeciliId(t.id); setEkran('tablo') }}
              />
            ))}
            <Kutucuk ikon="+" ad="TABLO" tur="bos" onClick={() => setPanel('tablo-yeni')} />
          </>
        )}

        {hazir && user && ekran === 'tablo' && seciliTablo && (
          <Tablo
            user={user}
            sahip={kisiSahip(user.uid)}
            tablo={seciliTablo}
            tema={temaBul(tema)}
            kolonlariYaz={(k) => kolonlariYazVeri(kisiSahip(user.uid), seciliTablo.id, k)}
            sil={seciliyiSil}
          />
        )}

        {hazir && user && ekran === 'grup' && seciliGrup && (
          <Grup
            user={user}
            grup={seciliGrup}
            tablolar={grupTablolar}
            tabloAc={(id, kayitAc) => {
              setSeciliGrupTabloId(id)
              setHemenKayit(Boolean(kayitAc))
              setEkran('gruptablo')
            }}
            tabloEkle={() => setPanel('grup-tablo-yeni')}
            cik={() => setEkran('ana')}
          />
        )}

        {hazir && user && ekran === 'gruptablo' && seciliGrupTablo && seciliGrup && (
          <Tablo
            user={user}
            sahip={grupSahip(seciliGrup.id)}
            tablo={seciliGrupTablo}
            tema={temaBul(tema)}
            uyeler={seciliGrup.uyeler}
            uyeBilgi={seciliGrup.uyeBilgi}
            hemenKayit={hemenKayit}
            kayitAcildi={() => setHemenKayit(false)}
            kolonlariYaz={(k) =>
              kolonlariYazVeri(grupSahip(seciliGrup.id), seciliGrupTablo.id, k)
            }
            sil={grupTablosunuSil}
          />
        )}
      </main>

      {hata && <p className="hata">{hata}</p>}

      {panel && (
        <Sayfa baslik={PANEL_BASLIK[panel]} kapat={() => setPanel(null)}>
          {panel === 'ayarlar' && <Ayarlar secili={tema} secildi={temaSec} cikisYap={cikisYap} uid={user.uid} />}

          {panel === 'tablo-yeni' && (
            <TabloYeni
              olustur={async (v) => {
                const id = await tabloOlustur(kisiSahip(user.uid), v)
                setSeciliId(id)
                setEkran('tablo')
              }}
              kapat={() => setPanel(null)}
            />
          )}

          {panel === 'grup-tablo-yeni' && (
            <TabloYeni
              olustur={async (v) => {
                const id = await tabloOlustur(grupSahip(seciliGrupId), v)
                setSeciliGrupTabloId(id)
                setEkran('gruptablo')
              }}
              kapat={() => setPanel(null)}
            />
          )}

          {panel === 'ekle' && (
            <GrupYeni
              user={user}
              olustur={async (diger, ad) => {
                const id = await grupOlustur(user, diger, ad)
                setSeciliGrupId(id)
                setEkran('grup')
              }}
              kapat={() => setPanel(null)}
            />
          )}
        </Sayfa>
      )}
    </div>
  )
}

function basliklar(ekran, user, tablo, grup, grupTablo) {
  if (ekran === 'sayfam') return { baslik: 'SAYFAM', altBaslik: user?.displayName || '' }
  if (ekran === 'tablo') return { baslik: tablo?.ad || '', altBaslik: 'tablo' }
  if (ekran === 'grup') return { baslik: grup?.ad || '', altBaslik: 'grup' }
  if (ekran === 'gruptablo') return { baslik: grupTablo?.ad || '', altBaslik: 'ortak tablo' }
  return { baslik: '7’ler', altBaslik: 'günlük' }
}

function isaret(ekran, tablo, grup, grupTablo) {
  if (ekran === 'gruptablo') return olcekBul(grupTablo?.olcek).isaret
  if (ekran === 'tablo') return olcekBul(tablo?.olcek).isaret
  if (ekran === 'grup') return (grup?.ad || '?').trim().charAt(0).toLocaleUpperCase('tr')
  return '7'
}

const PANEL_BASLIK = {
  ayarlar: 'AYARLAR',
  ekle: 'YENİ GRUP',
  'tablo-yeni': 'YENİ TABLO',
  'grup-tablo-yeni': 'YENİ ORTAK TABLO'
}

const POPUP_OLMAZ = [
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment'
]

function cevirHata(e) {
  if (!e?.code) return null
  const sozluk = {
    'auth/unauthorized-domain':
      'Bu adres Firebase’de izinli değil. Authentication → Settings → Authorized domains’e ekle.',
    'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
    'auth/network-request-failed': 'Ağ hatası. Bağlantını kontrol et.',
    'auth/operation-not-allowed': 'Google girişi Firebase’de açık değil.'
  }
  return sozluk[e.code] || 'Giriş yapılamadı (' + e.code + ')'
}
