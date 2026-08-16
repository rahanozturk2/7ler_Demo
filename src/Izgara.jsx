import { useRef, useState } from 'react'
import { tamTarih } from './eksen'
import { seriRengi } from './renkler'

// Sola kaydir -> sil, saga kaydir -> degistir, dokun -> islem sayfasi.
const ESIK = 70

// kimAdi verilirse tarihin yanina bir "kim" kolonu eklenir (grup tablosu).
// benimMi(satir) false donerse o satir kaydirilamaz - baskasinin kaydidir.
export default function Izgara({
  kolonlar, satirlar, tema, kimAdi, benimMi, sil, duzenle, dokun
}) {
  if (kolonlar.length === 0) {
    return <p className="yakinda">Önce bir kolon ekle, sonra kayıt girebilirsin.</p>
  }

  const kimVar = typeof kimAdi === 'function'
  const sablon = `${kimVar ? '92px 84px' : '100px'} repeat(${kolonlar.length}, minmax(62px, 1fr))`

  return (
    <div className="izgara-kutu">
      <div className="izgara-kaydir">
        <div className="izgara" style={{ '--sablon': sablon }}>
          <div className="izgara-baslik">
            <span className="hucre bas">tarih</span>
            {kimVar && <span className="hucre bas">kim</span>}
            {kolonlar.map((k, i) => (
              <span className="hucre bas" key={k.id} title={k.ad}>
                <span className="efsane-nokta" style={{ background: seriRengi(i, tema) }} />
                {k.ad}
              </span>
            ))}
          </div>

          {satirlar.map((s) => (
            <SatirOge
              key={s.id}
              satir={s}
              kolonlar={kolonlar}
              kimAdi={kimVar ? kimAdi : null}
              kilitli={typeof benimMi === 'function' ? !benimMi(s) : false}
              sil={() => sil(s)}
              duzenle={() => duzenle(s)}
              dokun={() => dokun(s)}
            />
          ))}

          {satirlar.length === 0 && (
            <div className="izgara-bos">Henüz kayıt yok. İlkini sen gir.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SatirOge({ satir, kolonlar, kimAdi, kilitli, sil, duzenle, dokun }) {
  const [dx, setDx] = useState(0)
  const bas = useRef(null)

  function basla(e) {
    if (kilitli) return
    bas.current = { x: e.clientX, y: e.clientY, kilit: null }
  }

  function surukle(e) {
    if (!bas.current) return
    const fx = e.clientX - bas.current.x
    const fy = e.clientY - bas.current.y

    // Yon kilidi: once yatay mi dikey mi karar ver, sonra karisma.
    if (bas.current.kilit === null && (Math.abs(fx) > 8 || Math.abs(fy) > 8)) {
      bas.current.kilit = Math.abs(fx) > Math.abs(fy) ? 'yatay' : 'dikey'
      if (bas.current.kilit === 'yatay') e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (bas.current.kilit === 'yatay') setDx(Math.max(-130, Math.min(130, fx)))
  }

  function birak() {
    const durum = bas.current
    const son = dx
    bas.current = null
    setDx(0)
    if (!durum) return
    if (durum.kilit === null) { dokun(); return }
    if (durum.kilit !== 'yatay') return
    if (son <= -ESIK) sil()
    else if (son >= ESIK) duzenle()
  }

  return (
    <div className="satir-yuva">
      <div className="satir-arka">
        <span className={`arka-etiket sol ${dx > 20 ? 'goster' : ''}`}>değiştir</span>
        <span className={`arka-etiket sag ${dx < -20 ? 'goster' : ''}`}>sil</span>
      </div>

      <div
        className={`izgara-satir ${kilitli ? 'kilitli' : ''}`}
        style={{ transform: `translateX(${dx}px)`, transition: dx ? 'none' : 'transform 0.2s ease' }}
        onPointerDown={basla}
        onPointerMove={surukle}
        onPointerUp={birak}
        onPointerCancel={birak}
      >
        <span className="hucre zaman">{satir.zamanMs ? tamTarih(satir.zamanMs) : 'şimdi'}</span>
        {kimAdi && <span className="hucre kim">{kimAdi(satir)}</span>}
        {kolonlar.map((k) => {
          const d = satir.degerler?.[k.id]
          return (
            <span className={`hucre ${typeof d === 'number' ? '' : 'bos'}`} key={k.id}>
              {typeof d === 'number' ? d : '–'}
            </span>
          )
        })}
      </div>
    </div>
  )
}
