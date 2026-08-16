# Kurulum notları

Bu iki adımı Ra yapacak; kod tarafı hazır bekliyor.

## 1. Firestore güvenlik kuralları

Şu an veritabanı **test modunda** — adresi bilen herkes her şeyi okuyup silebilir,
ayrıca 15 Eylül 2026'da kurallar kendiliğinden kapanıyor.

1. Firebase konsol → **Firestore Database → Rules**
2. Oradaki metni sil, `firestore.rules` dosyasının içeriğini yapıştır
3. **Publish**

Kural özeti: kendi verine yalnız sen erişirsin, grup verisine yalnız üyeler
erişir, ortak tabloda kimse başkasının satırını değiştiremez.

## 2. Bildirim (push)

Bildirimin kendisi ücretsiz. Ücretli olan tek şey Firebase'in **Cloud Functions**'ı
olurdu; onu kullanmıyoruz. Yerine kartsız ve ücretsiz **Cloudflare Worker** var.

### 2a. VAPID anahtarı

1. Firebase konsol → **Project settings → Cloud Messaging**
2. **Web configuration → Web Push certificates → Generate key pair**
3. Çıkan açık anahtarı `src/bildirim.js` içindeki `VAPID_ANAHTARI` alanına yapıştır

Bu adım bitene kadar Ayarlar'daki "Bildirimleri aç" düğmesi kapalı görünür.
Uygulama açıkken hal hatır sorma zaten çalışır.

### 2b. Servis hesabı anahtarı

1. Firebase konsol → **Project settings → Service accounts**
2. **Generate new private key** → inen JSON dosyasını sakla
3. ⚠️ Bu dosya **gizli**. Repoya koyma, kimseye gönderme.

### 2c. Worker

1. https://workers.cloudflare.com → ücretsiz hesap aç (kart istemiyor)
2. Yeni Worker oluştur, `worker/nabiz-worker.js` içeriğini yapıştır
3. Worker ayarları → **Variables and Secrets**:
   - `SERVIS_HESABI` → 2b'deki JSON dosyasının tamamı (Secret olarak)
   - `WEB_API_KEY`  → `src/firebase.js` içindeki `apiKey`
4. Deploy → çıkan adresi bana ver, uygulamaya bağlayayım

Worker ne yapıyor: çağıranın gerçekten giriş yapmış olduğunu doğruluyor,
nabzı gönderenin o grubun üyesi olduğunu kontrol ediyor, sonra hedeflerin
cihaz anahtarlarını bulup FCM'e bildirimi yolluyor. Gizli anahtar hiçbir
zaman tarayıcıya inmiyor.

## 3. Yayın (GitHub Pages)

Depo şu an **private**. Ücretsiz GitHub Pages yalnız public depolarda çalışır.
İki yol var:

- **Depoyu public yap** → Settings → General → en altta Change visibility.
  İş akışı (`.github/workflows/deploy.yml`) zaten hazır, ilk push'ta yayına alır.
- **Private kalsın, Firebase Hosting kullanalım** → kod gizli kalır, yayın yine
  ücretsiz. Bu durumda Firebase CLI kurulumu gerekir.

`FIKIR.md` repoya **girmiyor** (`.gitignore` içinde) — depo public olsa bile
ürün fikri dışarı çıkmaz.

## 4. Yayına çıkınca

Firebase konsol → **Authentication → Settings → Authorized domains** →
yayın adresini ekle (`rahanozturk2.github.io` veya Firebase Hosting adresi).
Yoksa Google girişi çalışmaz.
