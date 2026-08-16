# 7'ler

Mood ve alışkanlık takibi. Telefon önce, kurulabilir web uygulaması (PWA).

**Canlı:** https://rahanozturk2.github.io/7ler_Demo/

## Ne yapar

- Kendi tablolarını kurarsın: kolon adlarını sen yazarsın, ölçeği sen seçersin
  (0–10, 5 yıldız, 0–100)
- Her kayıt tarih + saat damgasıyla düşer, altında zaman serisi grafiği çıkar
- Grup kurarsın; ortak tabloda herkes kendi kaydını girer, grafikte
  kimin hangi kolonunun görüneceğini seçersin
- 15 renk teması; grafik renkleri temadan türer

## Çalıştırmak

```bash
npm install
npm run dev
```

## Yapı

| Dosya | İş |
|---|---|
| `src/veri.js` | Firestore katmanı — kişisel ve grup tabloları tek yoldan |
| `src/temalar.js` | 15 tema ve seri paletleri |
| `src/eksen.js` | Eksen tikleri — "güzel" sayılar ve gece yarısına hizalı saatler |
| `src/Grafik.jsx` | SVG zaman serisi; veri kaynağını bilmez, seri listesi alır |
| `src/Izgara.jsx` | Kayıt ızgarası — kaydırmalı satır |
| `src/GunIzgara.jsx` | Ortak tablo ızgarası — satır = gün, kolon = (kolon × üye) |

Yığın: Vite + React, Firebase (Auth + Firestore), GitHub Pages.
