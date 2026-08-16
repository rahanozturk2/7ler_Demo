# Kurulum — Ra'nın yapacakları

Kod tarafı bitti. Aşağıdaki dört adımı sırayla yaparsan zincir tamamlanır:
**ortak tablo → herkes doldurur → hal hatır sor → karşı tarafın telefonu çalar.**

Adım 1 ve 2 şart. Adım 3 ve 4 olmadan da uygulama çalışır, sadece bildirim
telefon kapalıyken düşmez.

---

## ✅ Zaten hazır olanlar

| | |
|---|---|
| Yayın | https://rahanozturk2.github.io/7ler_Demo/ |
| Firebase projesi | `lerdemo-b3239` — Auth + Firestore açık |
| VAPID anahtarı | `src/bildirim.js` içinde takılı |
| PWA | manifest, service worker, ikonlar hazır |
| Kök siten | `rahanozturk2.github.io` (deltav) etkilenmedi |

---

## 1. Güvenlik kuralları — ŞART

Firestore hâlâ **test modunda**: adresi bilen herkes bütün veriyi okuyup
silebilir, üstelik 15 Eylül 2026'da kurallar kendiliğinden kapanıyor.

1. https://console.firebase.google.com → `lerdemo-b3239`
2. **Firestore Database → Rules** sekmesi
3. Oradaki metni **tamamen sil**
4. Bu depodaki `firestore.rules` dosyasının içeriğini yapıştır
5. **Publish**

Ne yapıyor: kendi verine yalnız sen erişirsin · grup verisine yalnız üyeler
erişir · ortak tabloda kimse başkasının satırını değiştiremez · cihaz
bildirim anahtarlarını hiçbir kullanıcı göremez.

---

## 2. Yayın adresini Firebase'e tanıt — ŞART

**Authentication → Settings → Authorized domains → Add domain**

```
rahanozturk2.github.io
```

Yoksa yayındaki adreste Google girişi "bu adres izinli değil" der.

---

## 3. Cloudflare Worker — bildirimin göndericisi

Bildirimin kendisi ücretsiz. Ücretli olacak tek şey Firebase'in **Cloud
Functions**'ı olurdu (kart ister); onu kullanmıyoruz. Worker kartsız ve
ücretsiz aynı işi yapıyor.

### 3a. Servis hesabı anahtarı

1. Firebase konsol → **⚙ Project settings → Service accounts**
2. **Generate new private key** → JSON iner
3. ⚠️ Bu dosya **gizli**. Repoya koyma, kimseye gönderme, bana da yapıştırma.

### 3b. Worker'ı kur

1. https://workers.cloudflare.com → ücretsiz hesap aç (kart istemiyor)
2. **Create Worker** → adını `nabiz` koy → Deploy
3. **Edit code** → içindeki her şeyi sil → bu depodaki
   `worker/nabiz-worker.js` dosyasının tamamını yapıştır → **Deploy**
4. Worker → **Settings → Variables and Secrets** → iki tane ekle:

   | Ad | Tür | Değer |
   |---|---|---|
   | `SERVIS_HESABI` | Secret | 3a'daki JSON dosyasının **tamamı** |
   | `WEB_API_KEY` | Secret | `AIzaSyBP_TEuHtg6xmmm4bFWViZB3muaupZk1Zs` |

5. Deploy → üstte çıkan adresi kopyala
   (`https://nabiz.<kullanıcı-adın>.workers.dev` gibi)

### 3c. Adresi bana ver

`src/bildirim.js` içindeki `WORKER_ADRESI` alanına yazacağım, push edeceğim,
yayın kendini günceller. İstersen sen de yazabilirsin — tek satır.

---

## 4. Telefonlara kur

### Android (Chrome)
1. https://rahanozturk2.github.io/7ler_Demo/ aç
2. Menü → **Uygulamayı yükle**
3. Ana ekrandan aç

### iPhone (Safari — Chrome'da OLMAZ)
1. Adresi **Safari'de** aç
2. Paylaş → **Ana Ekrana Ekle**
3. **Mutlaka ana ekrandan aç.** Safari sekmesinden açarsan bildirim çalışmaz,
   bu bir iOS kuralı, bizim eksiğimiz değil.

### İki telefonda da
**SAYFAM → AYARLAR → Bildirimleri aç** → izin ver.
Bu, o cihazın bildirim anahtarını kaydeder. Yapılmazsa o telefona bildirim gitmez.

---

## Test senaryosu

1. Telefon A'dan gir → ana ekranda **+ EKLE** → telefon B'nin sahibini ara →
   grup adı ver (örn. `AİLE`) → **GRUBU KUR**
2. Grup ekranı → **+ TABLO** → ad: `Günlük`, ölçek: `0–10`, ilk kolon: `mood`
3. Tablo ekranı → sağ üst **⚙** → kolon ekle: `keyif`, `uyku`… istediğin kadar
4. **+ KAYIT** → değerleri gir → kaydet
5. Telefon B'den aynı gruba gir, aynı tabloya kendi kaydını gir
6. Izgarada **satır = gün**, kolonlar `mood: Ra, Ayşe` diye yan yana
7. Aşağıdaki grafikte iki kişinin çizgisi ayrı renkte
8. Telefon A → grup ekranı → **HAL HATIR SOR** → not yaz → **GÖNDER**
9. Telefon B'nin ekranı kapalıyken **bildirim düşmeli**
10. Bildirime dokun → uygulama açılır → nabız şeridi → **doldur ›** →
    kayıt ekranı doğrudan gelir

Adım 9 yalnız Worker kurulduysa çalışır. Kurulmadan da 10 çalışır,
sadece B uygulamayı kendi açmak zorunda kalır.

---

## Bir şey çalışmazsa

| Belirti | Sebep |
|---|---|
| Girişte "bu adres izinli değil" | Adım 2 yapılmadı |
| Veri okunamıyor / "permission denied" | Adım 1'deki kurallar yanlış yapıştırıldı |
| Bildirim izni hiç sorulmuyor | Sayfa HTTPS değil, ya da iOS'ta ana ekrandan açılmadı |
| "Gönderildi ama bildirim yok" | Worker kurulmadı ya da karşı taraf Bildirimleri açmadı |
| Aramada kimse çıkmıyor | Aradığın kişi henüz bir kere bile giriş yapmamış |

---

## Henüz yapılmayanlar

- **7'ler modülü** — tasarımı hazır, sen erteledin
- **Arka plan görselleri** — sen verecektin, tek CSS satırıyla takılır
- **Gruba ekleme onayı** — şu an karşı tarafa sormadan ekleniyor
- **Grup ekranında "bugün kim girdi"** — tek bakışta durum şeridi
