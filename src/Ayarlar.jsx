import { TEMALAR, SERI_PALETI } from './temalar'

// Daire, o temanin grafik renklerini onizler: dis halka seri paleti,
// ic daire temanin zemini, ortadaki nokta vurgusu.
function paletHalkasi(id) {
  const p = SERI_PALETI[id] || []
  const dilim = 360 / p.length
  const duraklar = p.map((renk, i) => `${renk} ${i * dilim}deg ${(i + 1) * dilim}deg`)
  return `conic-gradient(from 200deg, ${duraklar.join(', ')})`
}

export default function Ayarlar({ secili, secildi, cikisYap }) {
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

      <button className="dugme sil" onClick={cikisYap}>Çıkış yap</button>
    </>
  )
}
