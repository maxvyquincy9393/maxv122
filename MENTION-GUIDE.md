# 🎯 Bot Mention/Trigger Guide

## Cara Pakai Bot dengan Mention

Bot MAXVY sekarang **hanya merespons kalau dipanggil** dengan trigger keywords!

Ini berguna kalau:
- ✅ Kamu lagi chat dengan orang lain dan mau panggil bot
- ✅ Bot ada di group chat
- ✅ Kamu tidak mau bot merespons semua pesan

---

## 🔑 **Trigger Keywords:**

Bot akan merespons kalau kamu pakai salah satu keyword ini:

```
max
bot
ai
@max
hey max
hai max
halo max
```

**Case insensitive** - bisa huruf besar/kecil!

---

## 📱 **Cara Pakai di Chat Pribadi:**

### **Scenario: Lagi Chat dengan Teman**

```
Kamu: Halo, gimana kabarnya?
Teman: Baik nih, kamu?
Kamu: Alhamdulillah baik

Kamu: max, cari berita AI terbaru
Bot: 🔍 [hasil pencarian berita AI]

Kamu: Thanks bot!
Teman: Wah pake bot ya?
Kamu: Iya hehe

Kamu: hey max buatin gambar sunset
Bot: 🎨 [generate gambar]
```

**Bot hanya merespons pesan yang mention "max", "bot", dll!**

---

## 👥 **Cara Pakai di Group Chat:**

```
Alice: Guys, ada yang tau info F1?
Bob: Kurang tau deh

Charlie: max, cari jadwal F1
Bot: 🔍 [hasil pencarian]

David: Thanks!
Emma: Mantap botnya

Frank: @max tolong buatin sticker
Bot: [buat sticker]
```

---

## ✅ **Bot Akan Merespons:**

### **1. Dengan Trigger Keyword:**
```
max, apa kabar?
hey max tolong bantu
hai max cari info
bot, jelaskan AI
ai, buatin gambar
```

### **2. Dengan Command Prefix:**
```
.cari berita
.image sunset
.sticker "hello"
!help
/status
```

### **3. Mention di Tengah:**
```
eh @max tolong cari
guys @max bisa bantu ga?
```

---

## ❌ **Bot Tidak Merespons:**

```
Halo guys
Gimana kabarnya?
Besok meeting jam berapa?
Udah makan belum?
```

**Bot diam karena tidak ada trigger keyword!**

---

## 💡 **Tips Penggunaan:**

### **1. Mulai dengan Trigger:**
```
✅ max, tolong bantu
✅ hey max cari info
✅ bot, jelaskan ini
```

### **2. Atau Pakai Command:**
```
✅ .cari berita
✅ .help
✅ .image sunset
```

### **3. Kasih Koma/Titik Dua (Optional):**
```
✅ max: tolong cari
✅ max, apa itu AI?
✅ hey max - buatin gambar
```

---

## 🎨 **Contoh Lengkap:**

### **Chat Pribadi dengan Teman:**

```
[10:00] Kamu: Halo bro
[10:01] Teman: Hai, ada apa?
[10:02] Kamu: Lagi cari info soal AI nih
[10:03] Teman: Wah kurang tau

[10:04] Kamu: max, cari berita AI terbaru
[10:04] Bot: 🔍 Berikut berita AI terbaru:
              1. OpenAI releases GPT-5...
              2. Google announces Gemini...
              
[10:05] Kamu: Thanks bot!
[10:06] Teman: Wah pake bot ya? Keren

[10:07] Kamu: Iya hehe. hey max buatin gambar robot
[10:07] Bot: 🎨 Generating image...
              [sends image]

[10:08] Kamu: Mantap!
```

### **Group Chat:**

```
[11:00] Alice: Ada yang tau jadwal F1?
[11:01] Bob: Ga tau deh

[11:02] Charlie: max, cari jadwal F1
[11:02] Bot: 🏎️ Jadwal F1 2024:
              - Bahrain GP: March 2
              - Saudi Arabia: March 9
              ...

[11:03] Alice: Thanks Charlie!
[11:04] David: Wah ada bot

[11:05] Emma: @max tolong buatin sticker dari gambar ini
[11:05] Bot: [creates sticker]

[11:06] Frank: Mantap botnya
```

---

## ⚙️ **Konfigurasi:**

### **Ubah Trigger Keywords:**

Edit di `index.js`:

```javascript
const BOT_TRIGGERS = [
  'max',      // Nama bot
  'bot',      // Generic
  'ai',       // Generic
  '@max',     // Mention style
  'hey max',  // Casual
  'hai max',  // Indonesian
  'halo max'  // Indonesian
];
```

Tambah/hapus sesuai kebutuhan!

### **Disable Mention Mode:**

Kalau mau bot merespons semua pesan (mode lama), comment baris ini di `index.js`:

```javascript
// Comment baris ini:
// if (!isBotMentioned(text, isGroup) && !hasPrefix(text)) {
//   return;
// }
```

---

## 🔒 **Privacy:**

✅ **Bot hanya baca pesan yang mention bot**
✅ **Pesan lain diabaikan**
✅ **Tidak ganggu chat pribadi**
✅ **Conversation history tetap per user**

---

## 🐛 **Troubleshooting:**

### **Bot tidak merespons?**
- ✅ Pastikan pakai trigger keyword (`max`, `bot`, dll)
- ✅ Atau pakai command prefix (`.`, `!`, `/`)
- ✅ Check spelling trigger keyword
- ✅ Bot status active

### **Bot merespons semua pesan?**
- Check kode di `processMessage`
- Pastikan `isBotMentioned` check aktif

### **Trigger tidak work?**
- Verify trigger keyword di `BOT_TRIGGERS` array
- Check case sensitivity (should be case insensitive)

---

## 📊 **Comparison:**

### **Mode Lama (Merespons Semua):**
```
User: Halo
Bot: Halo! 👋

User: Gimana kabarnya?
Bot: Baik! Siap membantu...

User: Udah makan?
Bot: Saya AI, tidak perlu makan...
```
❌ **Bot merespons semua = ganggu chat**

### **Mode Baru (Mention Only):**
```
User: Halo guys
(bot diam)

User: Gimana kabarnya?
(bot diam)

User: max, tolong cari info
Bot: 🔍 [hasil pencarian]
```
✅ **Bot hanya merespons kalau dipanggil = tidak ganggu!**

---

## 🎉 **Benefits:**

1. ✅ **Tidak ganggu chat** dengan orang lain
2. ✅ **Privacy** - bot tidak baca semua pesan
3. ✅ **Flexible** - pakai kapan perlu aja
4. ✅ **Group friendly** - tidak spam di group
5. ✅ **Natural** - seperti mention orang biasa

---

🚀 **Sekarang bot lebih smart dan tidak ganggu chat kamu!**

Cukup panggil dengan "max", "bot", atau "ai" kalau butuh bantuan!
