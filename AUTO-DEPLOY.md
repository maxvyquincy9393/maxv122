# 🔄 Auto-Deploy Guide

## Cara Kerja Auto-Deploy

Setiap kali kamu **push ke GitHub branch `main`**, Render akan **otomatis deploy** bot kamu!

```
Local Changes → Git Push → GitHub → Render Auto-Deploy → Bot Updated! 🎉
```

## 🚀 Quick Deploy

### Windows:
```bash
deploy.bat
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

## ⚡ Workflow

1. **Edit code** di local
2. **Test** bot di local (optional)
3. **Run deploy script** atau push manual
4. **Wait 5-10 minutes** untuk Render build & deploy
5. **Bot updated!** ✅

## 📊 Monitor Deployment

### Check Status:
1. Login ke [Render Dashboard](https://dashboard.render.com)
2. Pilih service `maxvy-whatsapp-bot`
3. Tab **"Events"** untuk melihat deployment history
4. Tab **"Logs"** untuk melihat real-time logs

### Deployment Stages:
```
1. 📦 Building Docker image (~3-5 min)
2. 🚀 Deploying container (~1-2 min)
3. ✅ Health check passed
4. 🎉 Live!
```

## 🔔 Notifications

GitHub Actions akan otomatis run setiap push dan memberikan info:
- ✅ Deployment triggered
- 📦 Commit hash
- 👤 Author
- 📝 Commit message

Check di tab **"Actions"** di GitHub repo.

## ⚙️ Configuration

File `render.yaml` sudah dikonfigurasi dengan:
```yaml
autoDeploy: true  # Auto-deploy on push
```

### Disable Auto-Deploy (if needed):
1. Login ke Render Dashboard
2. Service Settings → Auto-Deploy
3. Toggle OFF

## 🐛 Troubleshooting

### Deployment Failed?
1. Check **Logs** di Render dashboard
2. Verify **Environment Variables** sudah diset
3. Check **Build Logs** untuk error messages

### Bot Not Updating?
1. Verify push berhasil: `git log --oneline -5`
2. Check Render Events untuk deployment status
3. Force redeploy: Render Dashboard → Manual Deploy

### WhatsApp Disconnected After Deploy?
- Normal! Scan QR code lagi di Logs
- Session tersimpan di container, akan persist setelah scan

## 📝 Best Practices

### Commit Messages:
```bash
git commit -m "✨ Add new feature"
git commit -m "🐛 Fix bug in sticker creation"
git commit -m "🚀 Improve performance"
git commit -m "📝 Update documentation"
```

### Before Pushing:
- ✅ Test locally if possible
- ✅ Check no sensitive data in code
- ✅ Update version in package.json (optional)
- ✅ Write clear commit message

### Deployment Frequency:
- 🟢 Safe to deploy multiple times per day
- 🟡 Each deploy takes ~5-10 minutes
- 🔴 Bot will restart (WhatsApp stays connected)

## 🎯 Quick Commands

```bash
# Check status
git status

# See recent commits
git log --oneline -5

# Push to deploy
git push origin main

# Force push (careful!)
git push origin main --force

# Rollback to previous commit
git reset --hard HEAD~1
git push origin main --force
```

## 🔗 Links

- **Render Dashboard:** https://dashboard.render.com
- **GitHub Repo:** https://github.com/maxvyquincy9393/maxv122
- **Health Check:** https://your-render-url.onrender.com/health

---

## 💡 Tips

1. **Test locally first** sebelum deploy (optional tapi recommended)
2. **Small commits** lebih baik dari 1 big commit
3. **Clear commit messages** memudahkan tracking
4. **Monitor logs** setelah deploy untuk ensure no errors
5. **Keep environment variables updated** di Render dashboard

---

🎉 **Happy Deploying!** Setiap push = Auto-deploy ke production!
