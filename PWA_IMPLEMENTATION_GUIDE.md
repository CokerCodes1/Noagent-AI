# NoAgentNaija PWA Implementation Guide

## Overview

NoAgentNaija has been fully transformed into a Progressive Web App (PWA) that provides a premium native-app-like experience across all devices. Users can now install the app on Android, iOS, tablets, and desktops.

## What's New

### ✅ Installation & Setup

- **Web App Manifest** (`public/manifest.json`) - Defines app metadata, icons, colors, and launch behavior
- **Service Worker** (`public/sw.js`) - Handles offline support, caching, push notifications, and background sync
- **PWA Meta Tags** (`index.html`) - Apple and Microsoft specific PWA support
- **Install Prompt** (`components/shared/InstallPrompt.jsx`) - Custom install banner for browsers

### ✅ Offline Support

- **Network-First Caching** - API calls prioritize network, fallback to cache
- **Cache-First Images & Videos** - Media loads from cache first, updates in background
- **Offline Fallback Page** - Beautiful offline indicator when connection lost
- **Smart Cache Versioning** - Automatic cache cleanup and updates
- **Background Sync** - Queues actions when offline, syncs when back online

### ✅ Performance

- **Code Splitting** - Separate bundles for vendor libraries
- **Optimized Build** - Minification, tree-shaking, lazy loading
- **Preload Critical Assets** - DNS preconnect and resource preloading
- **Efficient Caching** - Strategic cache layers (API, images, videos, documents)

### ✅ Push Notifications

- **Notification Infrastructure** (`utils/notificationUtils.js`)
- **Multiple Notification Types** - Rent reminders, maintenance alerts, bookings, messages
- **Permission Management** - User-friendly permission requests
- **Notification Settings** (`components/settings/PwaSettings.jsx`)
- **Rich Notifications** - Title, body, icon, action buttons

### ✅ Mobile Experience

- **Safe Area Support** - Adapts to iPhone notches and safe areas
- **Fullscreen Mode** - Standalone app without browser chrome
- **Touch Optimization** - Tap feedback and gesture-friendly UI
- **Portrait Orientation** - Optimized for portrait mode on mobile
- **Status Bar Styling** - Integrated with device status bar

### ✅ Cross-Platform Support

- ✅ Android Chrome & Samsung Internet
- ✅ iPhone Safari & iOS App
- ✅ iPad & Tablet Browsers
- ✅ Desktop (Chrome, Edge, Firefox)
- ✅ Windows PWA
- ✅ macOS PWA

---

## File Structure

```
frontend/
├── public/
│   ├── manifest.json           # PWA app manifest
│   ├── sw.js                   # Service worker
│   ├── browserconfig.xml       # Windows tiles config
│   ├── favicon.svg
│   └── icon-*.png             # App icons (192px, 512px, etc)
│
├── src/
│   ├── components/
│   │   └── shared/
│   │       └── InstallPrompt.jsx      # Install banner component
│   │
│   ├── components/settings/
│   │   └── PwaSettings.jsx            # PWA settings panel
│   │
│   ├── utils/
│   │   ├── pwaUtils.js               # Service worker registration
│   │   └── notificationUtils.js      # Push notification management
│   │
│   ├── App.jsx                       # Updated with PWA features
│   ├── main.jsx                      # Service worker registration
│   └── styles/
│       └── main.css                  # PWA styles included
│
├── index.html                        # Updated with PWA meta tags
└── vite.config.js                    # Updated build optimization
```

---

## PWA Features Implementation

### 1. Service Worker Registration

**File**: `src/utils/pwaUtils.js`

```javascript
import { registerServiceWorker, isRunningAsApp } from './utils/pwaUtils.js';

// Automatically registered in main.jsx
window.addEventListener('load', () => {
  registerServiceWorker();
});
```

### 2. Offline Support

**Files**: `public/sw.js`

The service worker implements multiple caching strategies:

- **API Requests**: Network-first (try network, fallback to cache)
- **Images**: Cache-first (use cache, update in background)
- **Videos**: Cache-first with size limit (max 50MB)
- **HTML/JS**: Network-first (get latest, fallback to cache)

### 3. Push Notifications

**File**: `src/utils/notificationUtils.js`

```javascript
import { enableNotificationsForRole, showLocalNotification } from './utils/notificationUtils.js';

// Request permission and subscribe
await enableNotificationsForRole('landlord');

// Show local notification
showLocalNotification('Rent Reminder', {
  body: 'Your rent is due in 5 days',
  icon: '/icon-192.png'
});
```

### 4. Install Prompt

**File**: `src/components/shared/InstallPrompt.jsx`

Custom install banner appears automatically on supported browsers:
- Shows app icon and description
- Install button triggers browser's install flow
- Dismissible with local storage persistence

### 5. PWA Settings

**File**: `src/components/settings/PwaSettings.jsx`

Users can:
- Enable/disable push notifications
- Check for app updates
- Clear app cache
- View app installation status

---

## Deployment Instructions

### Prerequisites

- Node.js 18+ and npm
- SSL certificate (HTTPS required for PWA)
- Domain name

### Build for Production

```bash
cd frontend
npm install
npm run build
```

This creates an optimized `dist/` folder with:
- Minified code
- Code-split bundles
- Optimized assets
- Service worker

### Deploy to Netlify

```bash
npm install -g netlify-cli

netlify deploy --prod --dir=dist
```

**Netlify Configuration** (`netlify.toml`):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Deploy to Vercel

```bash
npm install -g vercel

vercel deploy --prod
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

### Deploy to VPS (Custom Domain)

```bash
# Build
npm run build

# Copy to server
scp -r dist/* user@yourdomain.com:/var/www/noagentnaija/

# Configure nginx
# /etc/nginx/sites-available/noagentnaija:
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Cache Control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - Don't cache
    location /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    # Manifest - Cache 1 hour
    location /manifest.json {
        add_header Cache-Control "public, max-age=3600";
    }

    # SPA routing
    location / {
        root /var/www/noagentnaija;
        try_files $uri /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}
```

---

## Environment Variables

Add to `.env` for push notifications:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

Generate VAPID keys:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

---

## Testing the PWA

### Local Testing

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:5173` - Service Worker needs HTTPS or localhost

### Chrome DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Service Workers** - should show `sw.js`
4. Check **Cache Storage** - should show versioned caches
5. Check **Manifest** - should show manifest.json
6. Test **Offline** mode in Network tab

### Test Installation

1. **Android**: Open in Chrome → Menu → Install app
2. **iPhone**: Open in Safari → Share → Add to Home Screen
3. **Desktop**: Address bar → Install icon appears
4. **Windows**: Menu → Install → Opens Microsoft Store-like interface

### Test Offline

1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh page - should show offline page
4. Navigate to cached pages - should work
5. Try API call - should show error or cached data

### Test Notifications

1. Go to Settings section in any dashboard
2. Click "Enable Notifications"
3. Grant permission when prompted
4. Send test notification from backend

---

## Caching Strategy

### Cache Layers

1. **Critical Cache** (v1)
   - Essential app shell files
   - Cleared on major version updates

2. **Runtime Cache** (v1)
   - HTML and JavaScript bundles
   - Network-first strategy

3. **API Cache** (v1)
   - API responses
   - Network-first, long expiry

4. **Image Cache** (v1)
   - User avatars, property photos
   - Cache-first, permanent

5. **Video Cache** (v1)
   - Testimonials, property videos
   - Cache-first, 50MB limit per video

### Cache Versioning

When deploying updates:
1. Increment version number: `const CACHE_VERSION = 'v2'`
2. Old caches automatically cleaned on activation
3. Users get latest on next load

---

## Push Notifications Backend Setup

### Node.js Example

```javascript
const webpush = require('web-push');

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: 'mailto:support@noagentnaija.com'
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

// Send notification
async function sendNotification(subscription, notificationData) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(notificationData));
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Example usage
app.post('/api/notifications/send', async (req, res) => {
  const { userId, title, body, type } = req.body;

  // Get user's subscription from database
  const subscription = await getUserSubscription(userId);

  await sendNotification(subscription, {
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: `notification-${type}`,
    data: { url: `/`, type }
  });

  res.json({ success: true });
});
```

---

## Security Considerations

### Service Worker Security

- ✅ HTTPS-only (except localhost)
- ✅ No inline scripts
- ✅ Secure token storage in localStorage
- ✅ Content Security Policy headers
- ✅ No credential caching

### Cache Security

- ✅ No sensitive data cached
- ✅ API responses validated
- ✅ Cache versioning prevents stale data
- ✅ Cache cleared on logout

### Push Notification Security

- ✅ VAPID key verification
- ✅ Subscription endpoint verification
- ✅ Message payload signing
- ✅ No sensitive data in notifications

---

## Performance Metrics

Expected results with PWA:

- ⚡ **First Load**: 2-3 seconds
- ⚡ **Repeat Visits**: < 1 second (from cache)
- ⚡ **Offline Access**: Instant (cached)
- ⚡ **Install Time**: < 30MB app size
- ⚡ **Bundle Size**: ~200KB (gzipped)

---

## Troubleshooting

### Service Worker Not Registering

```javascript
// Check in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations);
});
```

### Cache Not Working

1. Check if HTTPS (required except localhost)
2. Check DevTools → Application → Service Workers
3. Check DevTools → Application → Cache Storage
4. Clear all caches: `caches.keys().then(k => k.forEach(n => caches.delete(n)))`

### Notifications Not Showing

1. Check if permission granted: `Notification.permission`
2. Check if subscription exists
3. Check browser notification settings
4. Test local notification first

### App Not Installing

1. Verify manifest.json is valid
2. Check if icons exist and are accessible
3. Ensure HTTPS is enabled
4. Check theme-color matches intent
5. Test on different browser

---

## Monitoring & Analytics

### Recommended Tools

- **Lighthouse**: PWA audit (`npm install -g lighthouse`)
- **Web Vitals**: Performance metrics
- **Sentry**: Error tracking
- **Firebase Analytics**: User engagement

### Key Metrics to Track

- Installation rate
- Active users (app mode vs browser)
- Offline usage frequency
- Notification engagement
- Cache hit rate

---

## Updates & Maintenance

### Pushing Updates

```javascript
// In service worker
// Increment version and deploy
const CACHE_VERSION = 'v2';
```

### User-Initiated Updates

```javascript
import { promptUpdateReload } from './utils/pwaUtils.js';

// In settings or update notification
promptUpdateReload(); // Prompts user to reload
```

### Automatic Updates

Service worker checks for updates every hour. Users notified with toast.

---

## Future Enhancements

- [ ] Advanced offline data sync
- [ ] Background geolocation
- [ ] Periodic background sync
- [ ] File system access
- [ ] Payment request API
- [ ] Web Share API integration
- [ ] Shared clipboard
- [ ] Screen wake lock

---

## Support & Resources

- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## License

NoAgentNaija PWA © 2026. All rights reserved.
