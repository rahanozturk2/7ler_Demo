import { useEffect, useMemo, useState } from 'react'
import {
  kimlik, olcekBul, satirlariDinle, satirEkle, satirSil, satirGuncelle,
  grafikleriYaz, gorunumYaz, varsayilanGrafikler, varsayilanGrupGrafikleri
} from './veri'
import { seriRengi } from './renkler'
import Sayfa from './Sayfa'
import SatirYeni from './SatirYeni'
import Izgara from './Izgara'
import GunIzgara from './GunIzgara'
import Grafik from './Grafik'

// Hem kisisel hem grup tablosunu ayni bilesen ciziyor.
// Fark tek yerde: uyeler verilirse tablo ortak olur.
export default function Tablo({
  user, sahip, tablo, tema, uyeler, uyeBilgi, kolonlariYaz, sil
}) {
  const [satirlar, setSatirlar] = useState([])
  const [hata, setHata] = useState(null)
  const [panel, setPanel] = useState(null)      // 'kayit' | 'ayarlar' | 'islem'
  const [duzenlenen, setDuzenlenen] = useState(null)
  const [secili, setSecili] = useState(null)
  const [hucre, setHucre] = useState(null)
  const [yeniKolon, setYeniKolon] = useState('')

  const olcek = olcekBul(tablo.olcek)
  const kolonlar = tablo.kolonlar || []
  const ortak = Array.isArray(uyeler) && uyeler.length > 0
  // Ortak tabloda varsayilan gunluk gorunum; Ra kayit listesine cevirebilir.
  const gunGorunumu = ortak && (tablo.gorunum || 'gun') === 'gun'

  useEffect(() => {
    return satirlariDinle(sahip, tablo.id, setSatirlar, (e) =>
      setHata('Satırlar okunamadı: ' + e.code)
    )
  }, [sahip.tur, sahip.id, tablo.id])

  // Satirlar yeniden eskiye geliyor; grafik icin eskiden yeniye lazim.
  const artan = useMemo(() => [...satirlar].reverse(), [satirlar])

  const kisaAd = (uid) => (uyeBilgi?.[uid]?.ad || 'üye').trim().split(' ')[0]

  // Grafik secenekleri. Kisisel tabloda anahtar = kolonId.
  // Ortak tabloda her (uye, kolon) ciftinin kendi serisi var: "uid|kolonId".
  // Sira kolon oncelikli: ayni kolonun uyeleri paletin komsu basamaklarini alir,
  // dogrulayici tam olarak o komsu ciftler icin gecti.
  const secenekler = useMemo(() => {
    if (!ortak) {
      return kolonlar.map((k, i) => ({
        anahtar: k.id,
        ad: k.ad,
        renk: seriRengi(i, tema),
        noktalar: noktaTopla(artan, (s) => s.degerler?.[k.id])
      }))
    }
    const cikti = []
    kolonlar.forEach((k) => {
      uyeler.forEach((uid) => {
        cikti.push({
          anahtar: uid + '|' + k.id,
          ad: kisaAd(uid) + ' · ' + k.ad,
          renk: seriRengi(cikti.length, tema),
          noktalar: noktaTopla(artan, (s) => (s.uid === uid ? s.degerler?.[k.id] : undefined))
        })
      })
    })
    return cikti
  }, [ortak, kolonlar, uyeler, uyeBilgi, artan, tema])

  const grafikler =
    tablo.grafikler ||
    (ortak ? varsayilanGrupGrafikleri(kolonlar, uyeler) : varsayilanGrafikler(kolonlar))

  function grafikleriKaydet(yeni) {
    grafikleriYaz(sahip, tablo.id, yeni).catch((e) => setHata('Grafik kaydedilemedi: ' + e.code))
  }

  function grafikTasi(i, yon) {
    const hedef = i + yon
    if (hedef < 0 || hedef >= grafikler.length) return
    const yeni = [...grafikler]
    ;[yeni[i], yeni[hedef]] = [yeni[hedef], yeni[i]]
    grafikleriKaydet(yeni)
  }

  function grafikEkle() {
    grafikleriKaydet([
      ...grafikler,
      {
        id: 'g-' + kimlik(),
        seriler: secenekler[0] ? [secenekler[0].anahtar] : [],
        ymin: null, ymax: null, xbas: null, xson: null
      }
    ])
  }

  async function kolonEkle(e) {
    e.preventDefault()
    const ad = yeniKolon.trim()
    if (!ad) return
    await kolonlariYaz([...kolonlar, { id: kimlik(), ad }])
    setYeniKolon('')
  }

  function satiriSil(s) {
    satirSil(sahip, tablo.id, s.id).catch((e) => setHata('Silinemedi: ' + e.code))
    setPanel(null)
  }

  function satiriDuzenle(s) {
    setDuzenlenen(s)
    setPanel('kayit')
  }

  const benimMi = (s) => !s.uid || s.uid === user.uid

  return (
    <>
      <button className="ayar-dugme" onClick={() => setPanel('ayarlar')} aria-label="Tablo ayarları">
        ⚙
      </button>

      <div className="rozetler">
        <span className="rozet">{olcek.ad}</span>
        <span className="rozet sonuk">{kolonlar.length} kolon</span>
        <span className="rozet sonuk">{satirlar.length} kayıt</span>
        {ortak && <span className="rozet sonuk">ortak</span>}
      </div>

      {gunGorunumu ? (
        <GunIzgara
          kolonlar={kolonlar}
          uyeler={uyeler}
          uyeBilgi={uyeBilgi}
          satirlar={satirlar}
          tema={tema}
          hucreAc={(h) => { setHucre(h); setPanel('hucre') }}
        />
      ) : (
        <Izgara
          kolonlar={kolonlar}
          satirlar={satirlar}
          tema={tema}
          kimAdi={ortak ? (s) => kisaAd(s.uid) : null}
          benimMi={ortak ? benimMi : null}
          sil={satiriSil}
          duzenle={satiriDuzenle}
          dokun={(s) => { setSecili(s); setPanel('islem') }}
        />
      )}

      {ortak && (
        <p className="ipucu ortali">
          {gunGorunumu
            ? 'Satır = gün. Hücrede o günün son kaydı görünür, dokununca günün tamamı açılır.'
            : 'Her kayıt kendi satırında. Yalnız kendi kayıtlarını kaydırabilirsin.'}
        </p>
      )}

      {kolonlar.length > 0 && (
        <button
          className="dugme birincil"
          onClick={() => { setDuzenlenen(null); setPanel('kayit') }}
        >+ KAYIT</button>
      )}

      {hata && <p className="hata">{hata}</p>}

      {kolonlar.length > 0 && (
        <>
          <p className="bolum-ad">Grafikler</p>

          {grafikler.map((g, i) => (
            <Grafik
              key={g.id}
              secenekler={secenekler}
              olcek={olcek}
              grafik={g}
              guncelle={(yeni) => grafikleriKaydet(grafikler.map((x, j) => (j === i ? yeni : x)))}
              sil={() => grafikleriKaydet(grafikler.filter((_, j) => j !== i))}
              tasi={(yon) => grafikTasi(i, yon)}
              ilkMi={i === 0}
              sonMu={i === grafikler.length - 1}
            />
          ))}

          <button className="dugme" onClick={grafikEkle}>+ GRAFİK</button>
        </>
      )}

      {panel === 'kayit' && (
        <Sayfa
          baslik={duzenlenen ? 'KAYDI DEĞİŞTİR' : 'YENİ KAYIT'}
          kapat={() => { setPanel(null); setDuzenlenen(null) }}
        >
          <SatirYeni
            tablo={tablo}
            baslangic={duzenlenen?.degerler}
            kaydet={(degerler) =>
              duzenlenen
                ? satirGuncelle(sahip, tablo.id, duzenlenen.id, degerler)
                : satirEkle(sahip, tablo.id, user.uid, degerler)
            }
            kapat={() => { setPanel(null); setDuzenlenen(null) }}
          />
        </Sayfa>
      )}

      {panel === 'hucre' && hucre && (
        <Sayfa
          baslik={(kisaAd(hucre.uid) + ' · ' + hucre.kolon.ad).toLocaleUpperCase('tr')}
          kapat={() => setPanel(null)}
        >
          <p className="bolum-ad">{gunBasligi(hucre.gun)}</p>
          <div className="kisiler">
            {hucre.kayitlar.map((k) => (
              <div className="kisi durgun" key={k.id}>
                <span className="saat">{saatYaz(k.zamanMs)}</span>
                <span className="kisi-ad">{k.degerler[hucre.kolon.id]}</span>
                {benimMi(k) && (
                  <>
                    <button
                      className="ufak-dugme"
                      onClick={() => { setPanel(null); satiriDuzenle(k) }}
                    >değiştir</button>
                    <button className="ufak-dugme tehlike" onClick={() => satiriSil(k)}>sil</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </Sayfa>
      )}

      {panel === 'islem' && secili && (
        <Sayfa baslik="KAYIT" kapat={() => setPanel(null)}>
          {benimMi(secili) ? (
            <>
              <button className="dugme birincil" onClick={() => satiriDuzenle(secili)}>
                DEĞİŞTİR
              </button>
              <button className="dugme sil" onClick={() => satiriSil(secili)}>
                Kaydı sil
              </button>
            </>
          ) : (
            <p className="yakinda">
              Bu kayıt <b>{kisaAd(secili.uid)}</b>&apos;e ait. Başkasının kaydını değiştiremezsin.
            </p>
          )}
        </Sayfa>
      )}

      {panel === 'ayarlar' && (
        <Sayfa baslik="TABLO AYARLARI" kapat={() => setPanel(null)}>
          <p className="bolum-ad">Kolonlar</p>
          <div className="kolonlar">
            {kolonlar.map((k) => (
              <span className="kolon" key={k.id}>
                {k.ad}
                <button
                  className="kolon-sil"
                  onClick={() => kolonlariYaz(kolonlar.filter((x) => x.id !== k.id))}
                  aria-label="Kolonu sil"
                >×</button>
              </span>
            ))}
          </div>

          <form className="satir-form" onSubmit={kolonEkle}>
            <input
              className="alan"
              value={yeniKolon}
              onChange={(e) => setYeniKolon(e.target.value)}
              placeholder="yeni kolon adı"
              maxLength={24}
            />
            <button className="yuvarlak-onay" disabled={!yeniKolon.trim()} aria-label="Ekle">✓</button>
          </form>

          {ortak && (
            <>
              <p className="ipucu">
                Kolonlar ortaktır — değiştirdiğinde grubun tamamı için değişir.
              </p>

              <p className="bolum-ad">Tablo görünümü</p>
              <div className="secenekler">
                <button
                  type="button"
                  className={`secenek ${gunGorunumu ? 'secili' : ''}`}
                  onClick={() => gorunumYaz(sahip, tablo.id, 'gun')}
                >
                  <span className="secenek-isaret">▤</span>
                  <span className="secenek-ad">günlük</span>
                </button>
                <button
                  type="button"
                  className={`secenek ${gunGorunumu ? '' : 'secili'}`}
                  onClick={() => gorunumYaz(sahip, tablo.id, 'kayit')}
                >
                  <span className="secenek-isaret">☰</span>
                  <span className="secenek-ad">kayıt listesi</span>
                </button>
              </div>
              <p className="ipucu">
                <b>Günlük:</b> satır = gün, herkesin o günkü değeri yan yana.{' '}
                <b>Kayıt listesi:</b> her giriş kendi satırında, saatiyle birlikte.
              </p>
            </>
          )}

          <p className="bolum-ad">Tehlikeli bölge</p>
          <button className="dugme sil" onClick={sil}>Tabloyu sil</button>
        </Sayfa>
      )}
    </>
  )
}

const GUN_AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function gunBasligi(ms) {
  const t = new Date(ms)
  return t.getDate() + ' ' + GUN_AY[t.getMonth()] + ' ' + t.getFullYear()
}

function saatYaz(ms) {
  if (!ms) return '--:--'
  const t = new Date(ms)
  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
}

function noktaTopla(satirlar, oku) {
  return satirlar
    .filter((s) => s.zamanMs && typeof oku(s) === 'number')
    .map((s) => ({ x: s.zamanMs, y: oku(s) }))
    .sort((a, b) => a.x - b.x)
}
