import { useMemo } from 'react'
import { seriRengi } from './renkler'

const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts']
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// Ortak tablonun izgarasi: satir = GUN, kolonlar = (kolon x uye).
// Hucrede o gunun SON kaydi durur; ayni gun birden fazla kayit varsa
// hucrenin kosesinde sayisi yazar ve dokununca hepsi listelenir.
export default function GunIzgara({ kolonlar, uyeler, uyeBilgi, satirlar, tema, hucreAc }) {
  const kisaAd = (uid) => (uyeBilgi?.[uid]?.ad || 'üye').trim().split(' ')[0]

  const gunler = useMemo(() => gunlereBol(satirlar), [satirlar])

  if (kolonlar.length === 0) {
    return <p className="yakinda">Önce bir kolon ekle, sonra kayıt girebilirsin.</p>
  }

  const sutunSayisi = kolonlar.length * uyeler.length
  const sablon = `84px repeat(${sutunSayisi}, minmax(54px, 1fr))`

  return (
    <div className="izgara-kutu">
      <div className="izgara-kaydir">
        <div className="izgara gunluk" style={{ '--sablon': sablon }}>
          <div className="izgara-baslik ikili">
            <span className="hucre bas kose" />
            {kolonlar.map((k) => (
              <span
                className="hucre bas ust"
                key={k.id}
                style={{ gridColumn: `span ${uyeler.length}` }}
                title={k.ad}
              >{k.ad}</span>
            ))}

            <span className="hucre bas kose">tarih</span>
            {kolonlar.map((k, ki) =>
              uyeler.map((uid, ui) => (
                <span className="hucre bas alt" key={k.id + uid}>
                  <span
                    className="efsane-nokta"
                    style={{ background: seriRengi(ki * uyeler.length + ui, tema) }}
                  />
                  {kisaAd(uid)}
                </span>
              ))
            )}
          </div>

          {gunler.map((g) => (
            <div className="izgara-satir gun" key={g.gun}>
              <span className="hucre zaman">{gunYaz(g.gun)}</span>
              {kolonlar.map((k) =>
                uyeler.map((uid) => {
                  const kayitlar = g.kayitlar.filter(
                    (s) => s.uid === uid && typeof s.degerler?.[k.id] === 'number'
                  )
                  // satirlar yeniden eskiye geliyor, ilki gunun son kaydi.
                  const son = kayitlar[0]
                  return (
                    <button
                      className={`hucre deger-hucre ${son ? '' : 'bos'}`}
                      key={k.id + uid}
                      onClick={() => son && hucreAc({ uid, kolon: k, gun: g.gun, kayitlar })}
                      disabled={!son}
                    >
                      {son ? son.degerler[k.id] : '–'}
                      {kayitlar.length > 1 && <span className="kayit-sayi">{kayitlar.length}</span>}
                    </button>
                  )
                })
              )}
            </div>
          ))}

          {gunler.length === 0 && (
            <div className="izgara-bos">Henüz kayıt yok. İlkini sen gir.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function gunlereBol(satirlar) {
  const harita = new Map()
  for (const s of satirlar) {
    if (!s.zamanMs) continue
    const d = new Date(s.zamanMs)
    d.setHours(0, 0, 0, 0)
    const anahtar = d.getTime()
    if (!harita.has(anahtar)) harita.set(anahtar, { gun: anahtar, kayitlar: [] })
    harita.get(anahtar).kayitlar.push(s)
  }
  return [...harita.values()].sort((a, b) => b.gun - a.gun)
}

function gunYaz(ms) {
  const t = new Date(ms)
  return t.getDate() + ' ' + AYLAR[t.getMonth()] + ' ' + GUNLER[t.getDay()]
}
