# 👥 Group Chat Guide

## Cara Pakai Bot di Group Chat

Bot MAXVY bisa dipanggil di group chat dengan cara **mention** atau **trigger keywords**!

---

## 🎯 Trigger Keywords

Bot akan merespons kalau kamu mulai pesan dengan salah satu keyword ini:

### **Bahasa Indonesia:**
```
max, apa kabar?
hey max, cari berita AI
hai max tolong buatin gambar
halo max, ingetin aku
@max jelaskan tentang AI
```

### **English:**
```
bot, what's up?
ai, search for news
hey max, create an image
@max explain AI
```

### **Dengan Command:**
```
.cari berita AI
.image sunset
.sticker "hello"
```

---

## ✅ **Cara Kerja:**

### **Di Private Chat:**
- Bot **selalu** merespons semua pesan
- Tidak perlu mention/trigger

### **Di Group Chat:**
- Bot **hanya** merespons kalau:
  1. ✅ Pesan dimulai dengan trigger keyword (`max`, `bot`, `ai`, dll)
  2. ✅ Pakai command dengan prefix (`.`, `!`, `/`)
  3. ✅ Mention bot dengan `@max`

- Bot **tidak** merespons kalau:
  - ❌ Chat biasa tanpa mention
  - ❌ Obrolan dengan orang lain

---

## 📝 **Contoh Penggunaan:**

### **✅ Bot Akan Merespons:**

```
User A: max, siapa kamu?
Bot: Saya Max, AI assistant dari maxvy.ai! 😊

User B: hey max cari jadwal F1
Bot: 🔍 [hasil pencarian]

User C: @max buatin sticker "mantap"
Bot: [kirim sticker]

User D: .help
Bot: [tampilkan help menu]
```

### **❌ Bot Tidak Merespons:**

```
User A: halo guys
User B: gimana kabarnya?
User C: besok meeting jam berapa?
(Bot diam karena tidak di-mention)
```

---

## 🎨 **Trigger Keywords Lengkap:**

- `max`
- `bot`
- `ai`
- `@max`
- `hey max`
- `hai max`
- `halo max`

**Case insensitive** - bisa huruf besar/kecil!

---

## 💡 **Tips:**

1. **Mulai pesan dengan trigger keyword:**
   ```
   max, tolong bantu
   ```

2. **Atau pakai command:**
   ```
   .cari berita
   ```

3. **Mention di tengah kalimat juga bisa:**
   ```
   eh @max tolong cari info
   ```

4. **Kasih koma/titik dua setelah trigger (optional):**
   ```
   max: jelaskan AI
   max, apa itu blockchain?
   ```

---

## 🚀 **Fitur di Group:**

✅ **Semua fitur bot bisa dipakai:**
- AI Chat
- Image Generation
- Sticker Creation
- Web Search
- Reminders
- OCR
- PDF Processing
- Dan lainnya!

✅ **Privacy:**
- Bot hanya baca pesan yang mention bot
- Pesan lain diabaikan

✅ **Multi-user:**
- Semua member bisa pakai bot
- Conversation history per user

---

## ⚙️ **Konfigurasi:**

Trigger keywords bisa diubah di `index.js`:

```javascript
const BOT_TRIGGERS = ['max', 'bot', 'ai', '@max', 'hey max', 'hai max', 'halo max'];
```

Tambah/hapus sesuai kebutuhan!

---

## 🐛 **Troubleshooting:**

**Bot tidak merespons di group?**
- ✅ Pastikan mulai pesan dengan trigger keyword
- ✅ Atau pakai command prefix (`.`, `!`, `/`)
- ✅ Check bot sudah di-add ke group
- ✅ Bot status active (owner bisa cek dengan `/status`)

**Bot merespons semua pesan?**
- Check kode di `processMessage` function
- Pastikan `isGroup` check aktif

---

## 📖 **Examples:**

### **Scenario 1: Group Discussion**
```
Alice: Guys, ada yang tau tentang AI?
Bob: Kurang tau deh
Charlie: max, jelaskan tentang AI
Bot: AI atau Artificial Intelligence adalah...
```

### **Scenario 2: Quick Command**
```
David: .cari berita teknologi
Bot: 🔍 Hasil pencarian...
```

### **Scenario 3: Multiple Mentions**
```
Emma: @max buatin gambar sunset
Bot: 🎨 Generating image...
[sends image]

Frank: @max tolong sticker dari gambar ini
Bot: [creates sticker]
```

---

🎉 **Sekarang bot bisa dipanggil di group chat dengan mudah!**
