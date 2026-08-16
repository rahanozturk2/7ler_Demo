import { useState } from 'react'
import { olcekBul } from './veri'
import DegerSecici from './DegerSecici'

export default function SatirYeni({ tablo, kaydet, kapat, baslangic }) {
  const olcek = olcekBul(tablo.olcek)
  const kolonlar = tablo.kolonlar || []
  const [degerler, setDegerler] = useState(() => ({ ...(baslangic || {}) }))
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState(null)

  const dolu = Object.values(degerler).filter((d) => typeof d === 'number')
  const gecerli = dolu.length > 0

  function degistir(kolonId, deger) {
    setDegerler((o) => ({ ...o, [kolonId]: deger }))
  }

  async function gonder(e) {
    e.preventDefault()
    if (!gecerli || mesgul) return
    setMesgul(true)
    setHata(null)
    try {
      // Bos birakilan kolonlar kaydedilmiyor.
      const temiz = Object.fromEntries(
        Object.entries(degerler).filter(([, d]) => typeof d === 'number')
      )
      await kaydet(temiz)
      kapat()
    } catch (err) {
      setHata('Kaydedilemedi: ' + (err?.code || err?.message || 'bilinmeyen hata'))
      setMesgul(false)
    }
  }

  return (
    <form onSubmit={gonder}>
      {kolonlar.map((k) => (
        <div className="giris-blok" key={k.id}>
          <p className="bolum-ad">{k.ad}</p>
          <DegerSecici
            olcek={olcek}
            deger={degerler[k.id] ?? null}
            degisti={(d) => degistir(k.id, d)}
          />
        </div>
      ))}

      <p className="ipucu">
        {baslangic
          ? 'Kaydın tarih ve saati değişmez, yalnız değerler güncellenir.'
          : 'Boş bıraktığın kolon kaydedilmez. Kayıt anındaki tarih ve saat otomatik düşer.'}
      </p>

      {hata && <p className="hata">{hata}</p>}

      <button className="dugme birincil" disabled={!gecerli || mesgul}>
        {mesgul ? 'KAYDEDİLİYOR…' : baslangic ? 'GÜNCELLE' : 'KAYDET'}
      </button>
    </form>
  )
}
