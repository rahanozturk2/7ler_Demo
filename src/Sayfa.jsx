// Alttan acilan yuvarlak sayfa. Hem App hem Tablo bunu kullaniyor.
export default function Sayfa({ baslik, kapat, children }) {
  return (
    <div className="perde" onClick={kapat}>
      <section className="sayfa" onClick={(e) => e.stopPropagation()}>
        <div className="tutamak" />
        <div className="sayfa-bas">
          <h2>{baslik}</h2>
          <button className="kapat" onClick={kapat} aria-label="Kapat">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}
