import { useLayoutEffect, useRef, useState } from 'react'
import { yTikleri, yYaz, xTikleri, xYaz, tamTarih, gunYaz, gunOku } from './eksen'

const YUKSEKLIK = 200
const BOSLUK = { ust: 14, sag: 14, alt: 28, sol: 38 }

// secenekler: [{ anahtar, ad, renk, noktalar: [{x, y}] }]
// Kisisel tabloda anahtar = kolonId, grup tablosunda "uid|kolonId".
// Grafik verinin nereden geldigini bilmez; sadece verilen secenekleri cizer.
export default function Grafik({
  secenekler, olcek, grafik, guncelle, sil, tasi, ilkMi, sonMu
}) {
  const kutuRef = useRef(null)
  const [en, setEn] = useState(320)
  const [ayarAcik, setAyarAcik] = useState(false)
  const [imlec, setImlec] = useState(null)

  // Eski kayitlar 'kolonlar' alanini kullaniyordu; ikisini de okuyoruz.
  const secili = grafik.seriler || grafik.kolonlar || []
  const seriler = secili
    .map((a) => secenekler.find((s) => s.anahtar === a))
    .filter(Boolean)

  // Kutu genisligini olcup SVG'yi gercek piksele ciziyoruz; boylece yazilar esnemiyor.
  useLayoutEffect(() => {
    const kutu = kutuRef.current
    if (!kutu) return
    const gozcu = new ResizeObserver(([g]) => setEn(Math.max(240, g.contentRect.width)))
    gozcu.observe(kutu)
    return () => gozcu.disconnect()
  }, [])

  const tumNoktalar = seriler.flatMap((s) => s.noktalar)
  const veriVar = tumNoktalar.length > 0

  // X sinirlari: kullanici sectiyse o, yoksa tum veri
  const veriBas = veriVar ? Math.min(...tumNoktalar.map((p) => p.x)) : 0
  const veriSon = veriVar ? Math.max(...tumNoktalar.map((p) => p.x)) : 1
  const xBas = grafik.xbas ?? veriBas
  let xSon = grafik.xson ?? veriSon
  if (xSon <= xBas) xSon = xBas + 3600000

  // Y sinirlari: kullanici sectiyse o, yoksa olcegin tamami
  const tamSayiOlcek = olcek.id !== '0-100'
  const y = yTikleri(
    grafik.ymin ?? olcek.min,
    grafik.ymax ?? olcek.max,
    tamSayiOlcek ? 5 : 4,
    tamSayiOlcek
  )
  const xt = xTikleri(xBas, xSon, en < 340 ? 4 : 5)

  const icEn = en - BOSLUK.sol - BOSLUK.sag
  const icBoy = YUKSEKLIK - BOSLUK.ust - BOSLUK.alt
  const px = (v) => BOSLUK.sol + ((v - xBas) / (xSon - xBas)) * icEn
  const py = (v) => BOSLUK.ust + (1 - (v - y.min) / (y.max - y.min)) * icBoy

  const zamanlar = [...new Set(tumNoktalar.map((p) => p.x))].sort((a, b) => a - b)

  function imlecTara(e) {
    if (!veriVar) return
    const kutu = e.currentTarget.getBoundingClientRect()
    const oran = (e.clientX - kutu.left - BOSLUK.sol) / icEn
    const hedef = xBas + oran * (xSon - xBas)
    let enYakin = null
    for (const z of zamanlar) {
      if (z < xBas || z > xSon) continue
      if (enYakin === null || Math.abs(z - hedef) < Math.abs(enYakin - hedef)) enYakin = z
    }
    setImlec(enYakin)
  }

  const imlecDegerleri = imlec
    ? seriler
        .map((s) => ({ ...s, deger: s.noktalar.find((p) => p.x === imlec)?.y }))
        .filter((s) => typeof s.deger === 'number')
    : []

  function seriAcKapa(anahtar) {
    const yeni = secili.includes(anahtar)
      ? secili.filter((a) => a !== anahtar)
      : [...secili, anahtar]
    guncelle({ ...grafik, seriler: yeni })
  }

  return (
    <div className="grafik-kutu">
      <div className="grafik-bas">
        <div className="efsane">
          {seriler.length === 0 && <span className="efsane-bos">seri seçilmedi</span>}
          {seriler.map((s) => (
            <span className="efsane-oge" key={s.anahtar}>
              <span className="efsane-nokta" style={{ background: s.renk }} />
              {s.ad}
            </span>
          ))}
        </div>
        <button
          className={`ufak-yuvarlak ${ayarAcik ? 'etkin' : ''}`}
          onClick={() => setAyarAcik((a) => !a)}
          aria-label="Grafik ayarları"
        >⚙</button>
      </div>

      {ayarAcik && (
        <div className="grafik-ayar">
          <p className="ayar-etiket">Seriler</p>
          <div className="kolonlar">
            {secenekler.map((s) => (
              <button
                key={s.anahtar}
                className={`kolon secim ${secili.includes(s.anahtar) ? 'acik' : ''}`}
                onClick={() => seriAcKapa(s.anahtar)}
              >
                <span className="efsane-nokta" style={{ background: s.renk }} />
                {s.ad}
              </button>
            ))}
          </div>

          <p className="ayar-etiket">Y sınırı</p>
          <div className="ayar-satir">
            <input
              className="alan ufak" type="number" inputMode="numeric"
              value={grafik.ymin ?? ''} placeholder={String(olcek.min)}
              onChange={(e) => guncelle({ ...grafik, ymin: sayiVeyaBos(e.target.value) })}
            />
            <span className="ayar-ayrac">—</span>
            <input
              className="alan ufak" type="number" inputMode="numeric"
              value={grafik.ymax ?? ''} placeholder={String(olcek.max)}
              onChange={(e) => guncelle({ ...grafik, ymax: sayiVeyaBos(e.target.value) })}
            />
            <button
              className="ufak-dugme"
              onClick={() => guncelle({ ...grafik, ymin: null, ymax: null })}
            >TAM ÖLÇEK</button>
          </div>

          <p className="ayar-etiket">X sınırı</p>
          <div className="ayar-satir">
            <input
              className="alan ufak" type="date"
              value={grafik.xbas ? gunYaz(grafik.xbas) : ''}
              onChange={(e) => guncelle({ ...grafik, xbas: gunOku(e.target.value, false) })}
            />
            <span className="ayar-ayrac">—</span>
            <input
              className="alan ufak" type="date"
              value={grafik.xson ? gunYaz(grafik.xson) : ''}
              onChange={(e) => guncelle({ ...grafik, xson: gunOku(e.target.value, true) })}
            />
            <button
              className="ufak-dugme"
              onClick={() => guncelle({ ...grafik, xbas: null, xson: null })}
            >TÜMÜ</button>
          </div>

          <div className="ayar-satir son">
            <button className="ufak-dugme" onClick={() => tasi(-1)} disabled={ilkMi}>↑ yukarı</button>
            <button className="ufak-dugme" onClick={() => tasi(1)} disabled={sonMu}>↓ aşağı</button>
            <button className="ufak-dugme tehlike" onClick={sil}>grafiği sil</button>
          </div>
        </div>
      )}

      <div className="cizim" ref={kutuRef}>
        {!veriVar ? (
          <p className="grafik-bos">Bu grafikte gösterilecek veri yok.</p>
        ) : (
          <svg
            width={en} height={YUKSEKLIK}
            onPointerMove={imlecTara}
            onPointerDown={imlecTara}
            onPointerLeave={() => setImlec(null)}
          >
            {y.tikler.map((v) => (
              <g key={v}>
                <line
                  x1={BOSLUK.sol} x2={en - BOSLUK.sag} y1={py(v)} y2={py(v)}
                  className="izgara-cizgi"
                />
                <text x={BOSLUK.sol - 7} y={py(v) + 3.5} className="eksen-yazi sag">
                  {yYaz(v)}
                </text>
              </g>
            ))}

            {xt.tikler.map((t) => (
              <text key={t} x={px(t)} y={YUKSEKLIK - 9} className="eksen-yazi orta">
                {xYaz(t, xt.adimMs)}
              </text>
            ))}

            {imlec !== null && imlec >= xBas && imlec <= xSon && (
              <line
                x1={px(imlec)} x2={px(imlec)} y1={BOSLUK.ust} y2={YUKSEKLIK - BOSLUK.alt}
                className="imlec-cizgi"
              />
            )}

            {seriler.map((s) => {
              const gorunen = s.noktalar.filter((p) => p.x >= xBas && p.x <= xSon)
              if (gorunen.length === 0) return null
              const d = gorunen.map((p, i) => (i ? 'L' : 'M') + px(p.x) + ' ' + py(p.y)).join(' ')
              return (
                <g key={s.anahtar}>
                  <path d={d} fill="none" stroke={s.renk} strokeWidth="2"
                        strokeLinejoin="round" strokeLinecap="round" />
                  {gorunen.length <= 60 && gorunen.map((p) => (
                    <circle key={p.x} cx={px(p.x)} cy={py(p.y)} r="4" fill={s.renk} className="nokta" />
                  ))}
                </g>
              )
            })}
          </svg>
        )}

        {imlecDegerleri.length > 0 && (
          <div className="balon" style={{ left: Math.min(Math.max(px(imlec), 70), en - 70) }}>
            <span className="balon-zaman">{tamTarih(imlec)}</span>
            {imlecDegerleri.map((s) => (
              <span className="balon-satir" key={s.anahtar}>
                <span className="efsane-nokta" style={{ background: s.renk }} />
                {s.ad}
                <b>{s.deger}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function sayiVeyaBos(m) {
  if (m === '') return null
  const s = Number(m)
  return Number.isFinite(s) ? s : null
}
