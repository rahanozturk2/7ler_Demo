import { useEffect, useState } from 'react'
import { grupAdiYaz, gruptanAyril, nabizGonder, nabizlariDinle, nabizGoruldu } from './veri'
import Sayfa from './Sayfa'
import Kutucuk from './Kutucuk'

// Son 12 saatteki nabizlar "taze" sayilir; sonrasi ekrandan dusuyor.
const TAZE = 12 * 60 * 60 * 1000

export default function Grup({ user, grup, tablolar, tabloAc, tabloEkle, cik }) {
  const [panel, setPanel] = useState(null)
  const [ad, setAd] = useState(grup.ad)
  const [hata, setHata] = useState(null)
  const [nabizlar, setNabizlar] = useState([])
  const [not, setNot] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const uyeler = grup.uyeler || []
  const digerleri = uyeler.filter((u) => u !== user.uid)

  useEffect(() => {
    return nabizlariDinle(grup.id, setNabizlar, (e) =>
      setHata('Nabızlar okunamadı: ' + e.code)
    )
  }, [grup.id])

  const simdi = Date.now()
  // Bana gelenler: baskasinin gonderdigi, hedefinde ben olan, taze olanlar.
  const bana = nabizlar.filter(
    (n) =>
      n.gonderen !== user.uid &&
      (!n.hedefler || n.hedefler.includes(user.uid)) &&
      !(n.gorenler || []).includes(user.uid) &&
      (!n.zamanMs || simdi - n.zamanMs < TAZE)
  )

  const kisaAd = (uid) => (grup.uyeBilgi?.[uid]?.ad || 'üye').trim().split(' ')[0]

  async function gonder() {
    if (gonderiliyor || digerleri.length === 0) return
    setGonderiliyor(true)
    setHata(null)
    try {
      await nabizGonder(grup.id, user, digerleri, not)
      setNot('')
      setPanel(null)
    } catch (e) {
      setHata('Gönderilemedi: ' + (e?.code || e?.message))
    }
    setGonderiliyor(false)
  }

  // Nabiza dokununca dogrudan ortak tablonun kayit ekranini ac.
  function nabizaGit(n) {
    if (tablolar.length === 0) {
      setHata('Bu grupta henüz ortak tablo yok. Önce bir tablo kur.')
      return
    }
    nabizGoruldu(grup.id, n.id, user.uid).catch(() => {})
    tabloAc(tablolar[0].id, true)
  }

  async function ayril() {
    const son = uyeler.length <= 1
    const soru = son
      ? 'Son üye sensin, çıkarsan grup ve içindeki ortak tablolar silinecek. Devam?'
      : grup.ad + ' grubundan çıkmak istediğine emin misin?'
    if (!confirm(soru)) return
    try {
      await gruptanAyril(grup.id, user.uid, uyeler.length)
      cik()
    } catch (err) {
      setHata('Çıkılamadı: ' + (err?.code || err?.message))
    }
  }

  return (
    <>
      <button className="ayar-dugme" onClick={() => setPanel('ayarlar')} aria-label="Grup ayarları">
        ⚙
      </button>

      <div className="rozetler">
        <span className="rozet">{uyeler.length} üye</span>
        {grup.kuran === user.uid && <span className="rozet sonuk">kuran sensin</span>}
      </div>

      {bana.map((n) => (
        <button className="nabiz-serit" key={n.id} onClick={() => nabizaGit(n)}>
          <span className="nabiz-dalga">◟◞</span>
          <span className="nabiz-yazi">
            <b>{n.gonderenAd?.split(' ')[0] || kisaAd(n.gonderen)}</b> hal hatır sordu
            {n.not && <span className="nabiz-not">“{n.not}”</span>}
          </span>
          <span className="nabiz-git">doldur ›</span>
        </button>
      ))}

      {digerleri.length > 0 && (
        <button className="dugme birincil nabiz-dugme" onClick={() => setPanel('nabiz')}>
          HAL HATIR SOR
        </button>
      )}

      <p className="bolum-ad">Ortak tablolar</p>
      <div className="kutucuklar ic">
        {tablolar.map((t) => (
          <Kutucuk
            key={t.id}
            ikon="◈"
            ad={t.ad.toLocaleUpperCase('tr')}
            onClick={() => tabloAc(t.id, false)}
          />
        ))}
        <Kutucuk ikon="+" ad="TABLO" tur="bos" onClick={tabloEkle} />
      </div>

      <p className="ipucu ortali">
        Kolonları bir kişi kurar, herkes kendi kaydını girer. Grafikte kimin hangi
        kolonunun görüneceğini sen seçersin.
      </p>

      <p className="bolum-ad">Üyeler</p>
      <div className="kisiler">
        {uyeler.map((uid) => {
          const bilgi = grup.uyeBilgi?.[uid] || {}
          return (
            <div className="kisi durgun" key={uid}>
              <Avatar kisi={bilgi} />
              <span className="kisi-ad">{bilgi.ad || '(adsız)'}</span>
              {uid === user.uid && <span className="kisi-eposta">sen</span>}
            </div>
          )
        })}
      </div>

      {hata && <p className="hata">{hata}</p>}

      {panel === 'nabiz' && (
        <Sayfa baslik="HAL HATIR SOR" kapat={() => setPanel(null)}>
          <p className="yakinda">
            {digerleri.map(kisaAd).join(', ')} kişisine sessiz bir “naber?” gidecek.
            Uygulamayı açtığında karşısına “doldur” şeridi çıkar.
          </p>

          <p className="bolum-ad">Not (isteğe bağlı)</p>
          <input
            className="alan"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="bugün nasıl geçti?"
            maxLength={60}
          />

          <button className="dugme birincil" onClick={gonder} disabled={gonderiliyor}>
            {gonderiliyor ? 'GÖNDERİLİYOR…' : 'GÖNDER'}
          </button>
        </Sayfa>
      )}

      {panel === 'ayarlar' && (
        <Sayfa baslik="GRUP AYARLARI" kapat={() => setPanel(null)}>
          <p className="bolum-ad">Grup adı</p>
          <form
            className="satir-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!ad.trim() || ad.trim() === grup.ad) return
              try {
                await grupAdiYaz(grup.id, ad)
                setPanel(null)
              } catch (err) {
                setHata('Ad değiştirilemedi: ' + (err?.code || err?.message))
              }
            }}
          >
            <input
              className="alan"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              maxLength={18}
            />
            <button
              className="yuvarlak-onay"
              disabled={!ad.trim() || ad.trim() === grup.ad}
              aria-label="Kaydet"
            >✓</button>
          </form>

          <p className="bolum-ad">Tehlikeli bölge</p>
          <button className="dugme sil" onClick={ayril}>
            {uyeler.length <= 1 ? 'Gruptan çık ve sil' : 'Gruptan çık'}
          </button>
        </Sayfa>
      )}
    </>
  )
}

function Avatar({ kisi }) {
  if (kisi.foto) return <img className="avatar" src={kisi.foto} alt="" />
  const harf = (kisi.ad || '?').trim().charAt(0).toLocaleUpperCase('tr')
  return <span className="avatar bos">{harf}</span>
}
