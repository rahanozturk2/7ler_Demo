export default function Kutucuk({ ikon, ad, onClick, tur = 'dolu', disabled }) {
  return (
    <button className={`kutucuk ${tur}`} onClick={onClick} disabled={disabled}>
      <span className="kutucuk-ikon">{ikon}</span>
      <span className="kutucuk-ad">{ad}</span>
    </button>
  )
}
