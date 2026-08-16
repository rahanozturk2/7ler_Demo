import { useEffect, useState } from 'react'
import { kullaniciAra } from './veri'

export default function GrupYeni({ user, olustur, kapat }) {
  const [sorgu, setSorgu] = useState('')
  const [sonuclar, setSonuclar] = useState([])
  const [araniyor, setAraniyor] = useState(false)
  const [secilen, setSecilen] = useState(null)
  const [ad, setAd] = useState('')
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState(null)

  // Her tusa basista sorgu atmayalim; yazmayi birakinca ara.
  useEffect(() => {
    if (secilen) return
    const q = sorgu.trim()
    if (q.length < 2) { setSonuclar([]); return }

    let iptal = false
    setAraniyor(true)
    const zaman = setTimeout(async () => {
      try {
        const r = await kullaniciAra(q, user.uid)
        if (!iptal) setSonuclar(r)
      } catch (e) {
        if (!iptal) setHata('Arama başarısız: ' + (e?.code || e?.message))
      } finally {
        if (!iptal) setAraniyor(false)
      }
    }, 350)

    return () => { iptal = true; clearTimeout(zaman) }
  }, [sorgu, secilen, user.uid])

  async function gonder(e) {
    e.preventDefault()
    if (!secilen || !ad.trim() || mesgul) return
    setMesgul(true)
    setHata(null)
    try {
      await olustur(secilen, ad)
      kapat()
    } catch (err) {
      setHata('Grup kurulamadı: ' + (err?.code || err?.message || 'bilinmeyen hata'))
      setMesgul(false)
    }
  }

  return (
    <form onSubmit={gonder}>
      <p className="bolum-ad">Kimi ekleyeceksin?</p>

      {secilen ? (
        <div className="kisi secili">
          <Avatar kisi={secilen} />
          <span className="kisi-ad">{secilen.ad || secilen.eposta}</span>
          <button
            type="button" className="kolon-sil"
            onClick={() => { setSecilen(null); setSorgu('') }}
            aria-label="Seçimi kaldır"
          >×</button>
        </div>
      ) : (
        <>
          <input
            className="alan"
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder="ad ya da e-posta"
            autoFocus
          />

          <div className="kisiler">
            {araniyor && <p className="ipucu">aranıyor…</p>}

            {!araniyor && sorgu.trim().length >= 2 && sonuclar.length === 0 && (
              <p className="ipucu">
                Kimse bulunamadı. Aradığın kişinin bir kere <b>Google ile giriş</b> yapmış
                olması gerekiyor.
              </p>
            )}

            {sonuclar.map((k) => (
              <button type="button" className="kisi" key={k.id} onClick={() => setSecilen(k)}>
                <Avatar kisi={k} />
                <span className="kisi-ad">{k.ad || '(adsız)'}</span>
                <span className="kisi-eposta">{k.eposta}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {secilen && (
        <>
          <p className="bolum-ad">Grubun adı</p>
          <input
            className="alan"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="AİLE"
            maxLength={18}
            autoFocus
          />
          <p className="ipucu">Bu ad, SAYFAM&apos;ın yanında kutucuk olarak görünecek.</p>
        </>
      )}

      {hata && <p className="hata">{hata}</p>}

      <button className="dugme birincil" disabled={!secilen || !ad.trim() || mesgul}>
        {mesgul ? 'KURULUYOR…' : 'GRUBU KUR'}
      </button>
    </form>
  )
}

function Avatar({ kisi }) {
  if (kisi.foto) return <img className="avatar" src={kisi.foto} alt="" />
  const harf = (kisi.ad || kisi.eposta || '?').trim().charAt(0).toLocaleUpperCase('tr')
  return <span className="avatar bos">{harf}</span>
}
