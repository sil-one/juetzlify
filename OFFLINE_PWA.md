# Jützlify Offline PWA Guide

## Overview

Jützlify is now a **full Progressive Web App (PWA)** with complete offline functionality. Users can:

1. ✅ **Use the app offline** - Access the app without internet if previously loaded
2. ✅ **Download tracks** - Explicitly download tracks for offline playback
3. ✅ **Play offline** - Listen to downloaded tracks without connection
4. ✅ **Install on device** - Add to home screen like a native app
5. ✅ **Sync plays** - Offline plays sync automatically when back online

## How It Works

### 1. Service Worker Caching Strategy

The Service Worker (`audio-cache-sw.js`) implements three caching strategies:

#### **Cache-First** (Static Assets)
- **Files**: JavaScript, CSS, images, fonts, album art
- **Behavior**: Serve from cache immediately, update cache in background
- **Why**: These files rarely change, fastest performance

#### **Network-First** (Dynamic Content)
- **Files**: HTML pages, API responses (tracks list, etc.)
- **Behavior**: Try network first, fall back to cache if offline
- **Why**: Get fresh data when online, work offline with stale data

#### **Special Audio Handling**
- **Files**: Audio streams (`/api/stream/:trackId`)
- **Behavior**: Cache with pinning support for downloads
- **Why**: Large files need smart management (LRU + pinning)

### 2. Three-Tier Caching System

```
┌─────────────────────┐
│  APP_SHELL_CACHE    │  HTML, CSS, JS, static assets
│  juetzlify-app-v2   │  - Cached during install
│                     │  - Updated on SW updates
└─────────────────────┘

┌─────────────────────┐
│  API_CACHE          │  API responses, album art
│  juetzlify-api-v2   │  - Network-first strategy
│                     │  - Offline fallback
└─────────────────────┘

┌─────────────────────┐
│  AUDIO_CACHE        │  Audio streams
│  juetzlify-audio-v2 │  - Explicit downloads (pinned)
│                     │  - Auto-cache (unpinned, LRU)
└─────────────────────┘
```

### 3. Download vs Auto-Cache

**Explicit Downloads (Pinned):**
- User clicks download button
- Stored with `sw-pinned: true` header
- Metadata in IndexedDB
- **Never auto-deleted** by LRU cleanup
- Survives cache clear (except manual delete)

**Auto-Cache (Unpinned):**
- Happens automatically during playback
- Subject to platform limits (iOS: 10, Android: 30, Desktop: 50)
- **Can be deleted** by LRU when limit exceeded
- No IndexedDB entry

### 4. Offline Play Tracking

When offline:
1. Play recorded after 15 seconds (like online)
2. Queued in `localStorage` with original timestamp
3. When back online, auto-syncs to backend
4. Backend preserves original timestamp for stats

## Installation & Usage

### For Users

#### Installing as PWA

**Desktop (Chrome/Edge):**
1. Visit Jützlify website
2. Look for install icon in address bar (⊕)
3. Click "Install Jützlify"
4. App opens in standalone window

**iOS (Safari):**
1. Visit Jützlify in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Icon appears on home screen

**Android (Chrome):**
1. Visit Jützlify
2. Banner appears: "Add Jützlify to Home screen"
3. Tap "Add"
4. Icon appears in app drawer

#### Using Offline

1. **First visit** - Load Jützlify while online
2. **Download tracks** - Click download button on tracks you want offline
3. **Go offline** - Turn off WiFi/mobile data
4. **Visit app** - Open from home screen or browser
5. **Play downloads** - Only downloaded tracks available offline
6. **Plays sync** - When back online, plays sync automatically

### Offline Indicator

When offline, a yellow banner appears at top:
```
⚠️ Offline-Modus - Nur abbägladeni Liäder verfügbar
```

### Download Limits

Platform-specific limits prevent storage issues:
- **iOS Safari**: 10 tracks (~67 MB)
- **Android**: 30 tracks (~200 MB)
- **Desktop**: 50 tracks (~334 MB)

Exceeding shows Swiss German error:
> Sorry, dis Grät understitzt leider nur {X} Liäder, dü bisch scho am Maximum

## Testing Offline Functionality

### Test 1: Offline App Loading

```bash
# 1. Visit Jützlify while online
# 2. Load public page fully
# 3. Open DevTools > Application > Service Workers
#    - Verify "audio-cache-sw.js" is activated
# 4. Open DevTools > Application > Cache Storage
#    - Verify "juetzlify-app-shell-v2" exists
#    - Verify "juetzlify-api-v2" exists
# 5. Go offline (DevTools > Network > Offline checkbox)
# 6. Refresh page
# ✅ App should load from cache
```

### Test 2: Download & Offline Playback

```bash
# 1. While online, download 2-3 tracks
#    - Watch progress indicator
#    - Verify checkmark appears
# 2. Check IndexedDB:
#    DevTools > Application > IndexedDB > juetzlify-downloads
#    - Should show downloaded tracks
# 3. Check Cache Storage:
#    DevTools > Application > Cache Storage > juetzlify-audio-v2
#    - Find cached audio streams
#    - Check headers for "sw-pinned: true"
# 4. Go offline
# 5. Play downloaded track
# ✅ Should play smoothly without network
```

### Test 3: Offline Play Sync

```bash
# 1. While online, download a track
# 2. Go offline
# 3. Play track for 15+ seconds
# 4. Check localStorage:
#    DevTools > Application > Local Storage
#    - Key: "juetzlify-offline-plays"
#    - Should contain play with timestamp
# 5. Go back online
# 6. Check console logs
# ✅ Should see: "Syncing X offline plays..."
# ✅ Should see: "✓ Synced X plays"
# 7. Check backend statistics
# ✅ Play should appear with original timestamp
```

### Test 4: PWA Installation

```bash
# Desktop Chrome:
# 1. Visit Jützlify
# 2. Look for install icon in address bar
# 3. Click "Install"
# 4. Standalone window opens
# 5. Close browser completely
# 6. Open from Start Menu/Applications
# ✅ Should open in app window, not browser tab

# Mobile (iOS/Android):
# 1. Visit Jützlify in browser
# 2. Add to home screen (process varies by OS)
# 3. Tap icon on home screen
# ✅ Should open fullscreen without browser UI
```

### Test 5: Cache Persistence

```bash
# 1. Download 5 tracks
# 2. Check total cache size:
#    DevTools > Application > Clear Storage
#    - See "Usage" section
# 3. Close all tabs
# 4. Wait 1 hour
# 5. Reopen Jützlify
# 6. Go offline immediately
# 7. Check downloads
# ✅ All 5 tracks still downloaded
# ✅ Can play without network
```

## Developer Notes

### Service Worker Updates

When updating the Service Worker:

1. **Increment CACHE_VERSION** in `audio-cache-sw.js`:
   ```javascript
   const CACHE_VERSION = 3; // Increment this
   const AUDIO_CACHE = 'juetzlify-audio-v3';
   const APP_SHELL_CACHE = 'juetzlify-app-shell-v3';
   const API_CACHE = 'juetzlify-api-v3';
   ```

2. **Force update** in browser:
   - DevTools > Application > Service Workers
   - Click "Update" or "Unregister"
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

3. **Automatic updates** happen hourly via:
   ```javascript
   // main.jsx
   setInterval(() => {
     registration.update();
   }, 60 * 60 * 1000);
   ```

### Debugging

**Console Logs:**
```javascript
// Service Worker logs
[Jützlify SW] Installing service worker...
[Jützlify SW] Pre-caching app shell
[Jützlify SW] Activating service worker...
[Jützlify SW] Serving audio from cache: trackId
[Jützlify SW] Download complete: trackId
[Jützlify SW] Network failed, trying cache: /api/tracks

// Main app logs
[Jützlify] Service Worker registered: /
Play queued: Track Title (public)
Offline - queuing play: Track Title
Syncing 3 offline plays...
✓ Synced 3 plays
```

**Cache Inspection:**
```javascript
// Check what's cached
caches.keys().then(console.log);

// Check specific cache
caches.open('juetzlify-audio-v2').then(cache => {
  cache.keys().then(console.log);
});

// Check cache size
navigator.storage.estimate().then(({usage, quota}) => {
  console.log(`Used ${usage/1024/1024} MB of ${quota/1024/1024} MB`);
});
```

### Key Files

```
frontend/
├── public/
│   ├── audio-cache-sw.js       # Service Worker (PWA logic)
│   └── manifest.json            # PWA manifest (install config)
├── src/
│   ├── components/
│   │   ├── OfflineIndicator.jsx   # Shows offline status
│   │   ├── DownloadButton.jsx     # Download UI
│   │   └── DownloadLimitModal.jsx # Limit warning
│   ├── hooks/
│   │   ├── useOnlineStatus.js     # Online/offline detection
│   │   └── useDownloads.js        # Download state management
│   ├── services/
│   │   ├── downloadService.js     # IndexedDB operations
│   │   └── offlinePlayService.js  # Offline play queue
│   └── contexts/
│       └── DownloadsContext.jsx   # Global download state
```

## Troubleshooting

### App won't load offline
- **Check**: DevTools > Application > Service Workers
- **Fix**: Ensure SW is activated and running
- **Clear**: Unregister SW and re-register

### Downloads not persisting
- **Check**: IndexedDB for download metadata
- **Check**: Cache for actual audio files
- **Fix**: Verify `sw-pinned: true` header set

### Offline plays not syncing
- **Check**: localStorage key `juetzlify-offline-plays`
- **Fix**: Ensure online status detected (`useOnlineStatus`)
- **Fix**: Check network requests in DevTools

### Install button not appearing
- **Check**: HTTPS required (except localhost)
- **Check**: Manifest linked in `index.html`
- **Check**: Service Worker registered successfully
- **Fix**: Meet PWA criteria (manifest + SW + HTTPS)

## Browser Support

| Browser | Offline App | Downloads | PWA Install |
|---------|-------------|-----------|-------------|
| Chrome Desktop | ✅ | ✅ | ✅ |
| Chrome Android | ✅ | ✅ | ✅ |
| Safari Desktop | ✅ | ✅ | ⚠️ Limited |
| Safari iOS | ✅ | ✅ | ✅ |
| Firefox Desktop | ✅ | ✅ | ⚠️ Limited |
| Edge Desktop | ✅ | ✅ | ✅ |

**Note**: Safari desktop has limited PWA install support but full offline functionality.

## Security Considerations

1. **HTTPS Required** - Service Workers only work on HTTPS (except localhost)
2. **Same-Origin** - Cache only same-origin resources
3. **Storage Limits** - Respects browser storage quotas
4. **Permission Prompt** - Some browsers ask for storage permission

## Future Enhancements

Potential improvements:
- [ ] Background sync for offline plays (Background Sync API)
- [ ] Periodic background sync for track updates
- [ ] Push notifications for new tracks
- [ ] Offline queue management UI
- [ ] Export/import downloads between devices
- [ ] Playlist offline support
- [ ] Pre-cache related tracks predictively
