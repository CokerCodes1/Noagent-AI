# Quick Start: NoAgentNaija PWA

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo>
cd NoAgentNaija/frontend

# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Server runs at http://localhost:5173
# Service Worker available (PWA works offline)
```

## 🔨 Build for Production

```bash
# Build optimized production bundle
npm run build

# Output: dist/ folder ready for deployment
```

## 📤 Deployment

### Netlify (Easiest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy production build
npm run build
netlify deploy --prod --dir=dist

# Or: Connect GitHub for automatic deployments
# 1. Push to GitHub
# 2. Link repo on netlify.com
# 3. Automatic deploy on push to main
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy production build
npm run build
vercel deploy --prod

# Or: Connect GitHub for automatic deployments
vercel link  # Link your project
git push     # Automatic deployment on push
```

### Custom VPS/Domain

```bash
# Build
npm run build

# Upload to your server
scp -r dist/* user@yourdomain.com:/var/www/noagentnaija/

# Configure nginx (see PWA_IMPLEMENTATION_GUIDE.md)
# Restart nginx
sudo systemctl restart nginx
```

## ✅ Testing

### Test PWA Locally

```bash
# Build and preview production
npm run build
npm run preview

# Open http://localhost:5173 in browser
# Open DevTools → Application tab
# Check Service Workers, Cache Storage, Manifest
```

### Test Installation

**Android**: Chrome → Menu → Install app
**iPhone**: Safari → Share → Add to Home Screen
**Desktop**: Click install icon in address bar

### Test Offline

DevTools → Network tab → Check "Offline" → Refresh
Should see offline page and cached content working

## 🔧 Configuration

### Environment Variables (.env)

```env
VITE_API_BASE_URL=http://localhost:5003/api
VITE_BACKEND_URL=http://localhost:5003
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### PWA Settings

Edit `src/utils/pwaUtils.js` and `public/sw.js` for:

- Cache versioning
- Caching strategies
- API cache duration
- Image cache size limits

## 📊 Performance Monitoring

```bash
# Lighthouse audit (requires Chrome/Chromium)
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view
```

Expected metrics:

- **Performance**: 85+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 90+

## 🐛 Troubleshooting

### Service Worker not registering?

```javascript
// Check in browser console
navigator.serviceWorker.getRegistrations().then((r) => console.log(r));
```

**Fix**: Must be HTTPS or localhost

### Cache not working?

```javascript
// Clear all caches
caches
  .keys()
  .then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
```

### Notifications not showing?

1. Check permissions: `Notification.permission`
2. Check subscription: `navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription())`
3. Test local notification first

### App not installing?

- Check if HTTPS enabled
- Verify `manifest.json` is valid
- Check app icons exist: `public/icon-*.png`
- Clear browser cache and try again

## 📚 Documentation

- **Detailed Guide**: [PWA_IMPLEMENTATION_GUIDE.md](./PWA_IMPLEMENTATION_GUIDE.md)
- **Service Worker**: `public/sw.js`
- **PWA Utils**: `src/utils/pwaUtils.js`
- **Notifications**: `src/utils/notificationUtils.js`

## 🎯 PWA Features Checklist

- ✅ Service Worker (offline support)
- ✅ Web App Manifest (installable)
- ✅ HTTPS required (security)
- ✅ Responsive design (mobile)
- ✅ App icons (branding)
- ✅ Splash screens (launch)
- ✅ Status bar integration (native feel)
- ✅ Push notifications (engagement)
- ✅ Offline fallback page (UX)
- ✅ Install prompt (conversion)

## 🚀 Next Steps

1. **Setup HTTPS**: Get SSL certificate from Let's Encrypt
2. **Configure Backend**: Set up push notification API endpoints
3. **Add Icons**: Generate app icons using tools/create-pwa-icons.sh
4. **Test on Devices**: Test on iOS, Android, tablets
5. **Monitor Analytics**: Track installations and usage
6. **Enable Notifications**: Request permission when appropriate
7. **Promote Install**: Add install prompt to landing pages

## 📞 Support

For issues or questions:

1. Check [PWA_IMPLEMENTATION_GUIDE.md](./PWA_IMPLEMENTATION_GUIDE.md)
2. Review browser console for errors
3. Check DevTools Application tab
4. Test with Lighthouse: `lighthouse <url> --view`

---

## Scripts Reference

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

Happy building! 🎉
