import { useState } from 'react'
import { OLCEKLER } from './veri'

export default function TabloYeni({ olustur, kapat }) {
  const [ad, setAd] = useState('')
  const [olcek, setOlcek] = useState('0-10')
  const [kolon, setKolon] = useState('')
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState(null)

  const gecerli = ad.trim().length > 0 && kolon.trim().length > 0

  async function gonder(e) {
    e.preventDefault()
    if (!gecerli || mesgul) return
    setMesgul(true)
    setHata(null)
    try {
      await olustur({ ad, olcek, ilkKolon: kolon })
      kapat()
    } catch (err) {
      setHata('Kaydedilemedi: ' + (err?.code || err?.message || 'bilinmeyen hata'))
      setMesgul(false)
    }
  }

  return (
    <form onSubmit={gonder}>
      <p className="bolum-ad">Tablo adı</p>
      <input
        className="alan"
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        placeholder="Günlük"
        maxLength={24}
        autoFocus
      />

      <p className="bolum-ad">Ölçek</p>
      <div className="secenekler">
        {OLCEKLER.map((o) => (
          <button
            type="button"
            key={o.id}
            className={`secenek ${olcek === o.id ? 'secili' : ''}`}
            onClick={() => setOlcek(o.id)}
          >
            <span className="secenek-isaret">{o.isaret}</span>
            <span className="secenek-ad">{o.ad}</span>
          </button>
        ))}
      </div>

      <p className="bolum-ad">İlk kolonun adı</p>
      <input
        className="alan"
        value={kolon}
        onChange={(e) => setKolon(e.target.value)}
        placeholder="mood"
        maxLength={24}
      />
      <p className="ipucu">Sonra istediğin kadar kolon ekleyebilirsin.</p>

      {hata && <p className="hata">{hata}</p>}

      <button className="dugme birincil" disabled={!gecerli || mesgul}>
        {mesgul ? 'OLUŞTURULUYOR…' : 'OLUŞTUR'}
      </button>
    </form>
  )
}
