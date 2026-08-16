// Olcege gore degisen deger girisi.
// 5 yildiz  -> yildizlar
// 0-10      -> 11 yuvarlak rakam
// 0-100     -> kaydiraci
export default function DegerSecici({ olcek, deger, degisti }) {
  if (olcek.id === 'yildiz5') {
    return (
      <div className="yildizlar">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={`yildiz ${deger >= n ? 'dolu' : ''}`}
            onClick={() => degisti(deger === n ? null : n)}
            aria-label={n + ' yıldız'}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  if (olcek.id === '0-10') {
    const rakamlar = Array.from({ length: 11 }, (_, i) => i)
    return (
      <div className="rakamlar">
        {rakamlar.map((n) => (
          <button
            type="button"
            key={n}
            className={`rakam ${deger === n ? 'secili' : ''}`}
            onClick={() => degisti(deger === n ? null : n)}
          >
            {n}
          </button>
        ))}
      </div>
    )
  }

  // 0-100
  const gecerli = typeof deger === 'number'
  return (
    <div className="kaydirak-kutu">
      <div className="kaydirak-deger">{gecerli ? deger : '—'}</div>
      <input
        type="range"
        className="kaydirak"
        min={olcek.min}
        max={olcek.max}
        step={olcek.adim}
        value={gecerli ? deger : 50}
        onChange={(e) => degisti(Number(e.target.value))}
      />
    </div>
  )
}
