import { useState } from 'react'
import { TEMALAR, SERI_PALETI } from './temalar'
import { bildirimDurumu, bildirimleriAc } from './bildirim'

// Daire, o temanin grafik renklerini onizler: dis halka seri paleti,
// ic daire temanin zemini, ortadaki nokta vurgusu.
function paletHalkasi(id) {
  const p = SERI_PALETI[id] || []
  const dilim = 360 / p.length
  const duraklar = p.map((renk, i) => `${renk} ${i * dilim}deg ${(i + 1) * dilim}deg`)
  return `conic-gradient(from 200deg, ${duraklar.join(', ')})`
}

export default function Ayarlar({ secili, secildi, cikisYap, uid }) {
  const [durum, setDurum] = useState(bildirimDurumu())
  const [bildirimHata, setBildirimHata] = useState(null)

  async function bildirimAc() {
    setBildirimHata(null)
    try {
      await bildirimleriAc(uid)
      setDurum('granted')
    } catch (e) {
      setBildirimHata(e.message)
    }
  }

  return (
    <>
      <p className="bolum-ad">Tema</p>
      <div className="tema-izgara">
        {TEMALAR.map((t) => (
          <button
            key={t.id}
            className={`tema ${secili === t.id ? 'secili' : ''}`}
            onClick={() => secildi(t.id)}
            title={t.ad}
          >
            <span
              className="tema-daire"
              style={{ background: paletHalkasi(t.id) }}
            >
              <span className="tema-ic" style={{ background: t.zemin }}>
                <span className="tema-nokta" style={{ background: t.vurgu }} />
              </span>
            </span>
            <span className="tema-ad">{t.ad}</span>
          </button>
        ))}
      </div>

      <p className="bolum-ad">Bildirim</p>
      {durum === 'granted' ? (
        <p className="ipucu">Bu cihazda bildirim açık.</p>
      ) : durum === 'kurulmadi' ? (
        <p className="ipucu">
          Push altyapısı henüz bağlanmadı — VAPID anahtarı girilince burası açılacak.
          Uygulama açıkken hal hatır sorma zaten çalışıyor.
        </p>
      ) : durum === 'desteklenmiyor' ? (
        <p className="ipucu">Bu tarayıcı bildirimi desteklemiyor.</p>
      ) : (
        <button className="dugme" onClick={bildirimAc}>Bildirimleri aç</button>
      )}
      {bildirimHata && <p className="hata">{bildirimHata}</p>}

      <button className="dugme sil" onClick={cikisYap}>Çıkış yap</button>
    </>
  )
}
