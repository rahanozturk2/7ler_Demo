import { useState } from 'react'
import { grupAdiYaz, gruptanAyril } from './veri'
import Sayfa from './Sayfa'
import Kutucuk from './Kutucuk'

export default function Grup({ user, grup, tablolar, tabloAc, tabloEkle, cik }) {
  const [panel, setPanel] = useState(null)
  const [ad, setAd] = useState(grup.ad)
  const [hata, setHata] = useState(null)

  const uyeler = grup.uyeler || []

  async function adiKaydet(e) {
    e.preventDefault()
    if (!ad.trim() || ad.trim() === grup.ad) return
    try {
      await grupAdiYaz(grup.id, ad)
      setPanel(null)
    } catch (err) {
      setHata('Ad değiştirilemedi: ' + (err?.code || err?.message))
    }
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

      <p className="bolum-ad">Ortak tablolar</p>
      <div className="kutucuklar ic">
        {tablolar.map((t) => (
          <Kutucuk
            key={t.id}
            ikon="◈"
            ad={t.ad.toLocaleUpperCase('tr')}
            onClick={() => tabloAc(t.id)}
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

      <p className="bolum-ad">Titreşim</p>
      <p className="yakinda">
        Sıradaki turda: üyelere sessiz bir &quot;naber?&quot; gönderme ve bildirim.
      </p>

      {panel === 'ayarlar' && (
        <Sayfa baslik="GRUP AYARLARI" kapat={() => setPanel(null)}>
          <p className="bolum-ad">Grup adı</p>
          <form className="satir-form" onSubmit={adiKaydet}>
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
