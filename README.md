# Atamation Media Downloader

**Atamation** — YouTube ve diğer popüler platformlardan medya analizi / aralık indirme uygulaması.

Flask tabanlı web arayüzü + masaüstü (PyInstaller) paketi. Motor: `yt-dlp` + FFmpeg.

**Sürüm:** 1.1

## Özellikler

- URL analizi (başlık, süre, kalite listesi)
- Zaman aralığı ile kesim / dışa aktarma
- YouTube, TikTok, Instagram, X/Twitter ve diğer desteklenen hostlar
- Frameless masaüstü penceresi (özel başlık çubuğu)
- Sağ tık ile panodaki HTTP/HTTPS bağlantısını URL alanına yapıştırma
- Kenar / köşe tutamaçlarıyla pencere boyutlandırma
- Gizli easter egg: **Arkanoid** (↑ ile açılır)
- Masaüstü exe veya kaynak koddan çalıştırma

## 1.1 değişiklikleri

- URL alanına sağ tıklayınca panodaki geçerli bağlantı otomatik yerleşir
- Frameless pencerede 8 kenar/köşeden yeniden boyutlandırma
- Gizli oyun dino-koşudan Arkanoid’e geçti (fare / ok tuşları, 3 can, seviye)
- Yumuşak ışık geçişli koyu tema; sürüm rozeti **1.1**

## Gereksinimler

- Python 3.10+
- [FFmpeg](https://ffmpeg.org/) sistem PATH’inde olmalı (`ffmpeg` komutu çalışmalı)
- İnternet bağlantısı

> Bu uygulamada API key / Gmail şifresi **gerekmez**. Kullanıcı yalnızca medya URL’si girer.

## Kurulum (kaynak kod)

```bash
git clone https://github.com/Atamations/youtube-downloader.git
cd youtube-downloader
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Çalıştırma

Web arayüzü:

```bash
python app.py
```

Tarayıcıda genelde `http://127.0.0.1:5000` açılır.

Masaüstü sarmalayıcı:

```bash
python desktop_app.py
```

## Exe üretmek (isteğe bağlı)

```powershell
.\build_exe.ps1
```

Çıktı `dist/` altına düşer; exe dosyaları bu repoya **commit edilmez**.

## Docker (isteğe bağlı)

```bash
docker build -t atamation-downloader .
docker run --rm -p 5000:5000 atamation-downloader
```

## Kullanım

1. Desteklenen bir platform URL’si yapıştırın (veya URL alanına sağ tıklayın)
2. Analiz edin → kalite / süre bilgisi gelir
3. İsterseniz başlangıç–bitiş aralığı seçin
4. Dışa aktarın (MP4 / desteklenen formatlar)

## Güvenlik / gizlilik

- Repoda API anahtarı, token veya kişisel hesap bilgisi yoktur.
- İndirilen dosyalar cihazınızda kalır; Atamation sunucusuna yüklenmez.
- Telif hakkı olan içerikleri yalnızca yasal haklarınız olan durumlarda kullanın.

## Lisans

© 2026 Atamation — kişisel / portföy kullanımı. Ayrıntılar için `LICENSE.txt`.
